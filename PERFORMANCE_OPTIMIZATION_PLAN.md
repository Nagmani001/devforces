# DevForces Performance Optimization Plan

## Problem Statement

Harkiart runs online cohorts with approximately **10,000 students** and wants to conduct coding contests where:

1. Students write backend APIs (e.g., car rental system)
2. Each student's backend runs in an **isolated environment** (Docker)
3. **Test cases must be hidden** from users
4. **Ranking parameters:**
   - Number of test cases passed
   - Number of retries (failed attempts before first AC)
   - Timestamp of submission

---

## Current Architecture Analysis

### What DevForces Solves Correctly

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Retry tracking | ✅ | `numberOfFailBefore1stAC` field in `ChallengeResult` |
| Timestamp tracking | ✅ | `timeOf1stAcSinceContestStart` field |
| Hidden test cases | ✅ | Tests run server-side, never exposed to client |
| Isolated execution | ✅ | Docker containers per submission |
| Authentication | ✅ | JWT on all endpoints |
| Leaderboard | ✅ | Redis sorted set with Codeforces-style penalty |
| Real-time updates | ✅ | Redis Pub/Sub + SSE streaming |

### Current Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DevForces Architecture                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐       │
│  │ Frontend │     │ Backend  │     │  Redis   │     │  Worker  │       │
│  │ Next.js  │────▶│ Express  │────▶│  Queue   │────▶│  Node.js │       │
│  │ :3000    │     │  :3001   │     │  :6379   │     │          │       │
│  └──────────┘     └──────────┘     └──────────┘     └──────────┘       │
│                         │                                 │             │
│                         │                                 │             │
│                         ▼                                 ▼             │
│                   ┌──────────┐                     ┌──────────┐        │
│                   │PostgreSQL│                     │  Docker  │        │
│                   │ Database │                     │ Daemon   │        │
│                   └──────────┘                     └──────────┘        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Submission Processing Flow

```
1. Client requests presigned S3 URL
2. Client uploads zip to S3
3. Client confirms submission
4. Backend pushes to Redis queue
5. Worker pops from queue
6. Worker downloads zip from S3
7. Worker extracts and builds Docker image    ◄── BOTTLENECK #1 (60-120s)
8. Worker starts containers
9. Worker waits for health check              ◄── BOTTLENECK #2 (2-60s)
10. Worker runs tests
11. Worker publishes results via Pub/Sub
12. Backend updates database and leaderboard
13. Worker cleans up containers
```

---

## Performance Bottlenecks

### Current Response Time: ~2 minutes

| Step | Time | Percentage | Root Cause |
|------|------|------------|------------|
| S3 Download | 5-15s | 8% | Network latency, file size |
| **Docker Build** | **60-120s** | **60%** | `--no-cache` flag, full rebuild |
| Container Start | 5-10s | 5% | Docker overhead |
| **Health Check** | **2-60s** | **25%** | Fixed 2s intervals, up to 30 retries |
| Test Execution | 5-30s | 15% | Vitest startup + tests |
| Cleanup | 5-10s | 5% | Container removal |
| **Total** | **~120s** | 100% | |

### Bottleneck #1: Docker Build Without Cache

**Location:** `worker/src/index.ts` line 46

```typescript
// CURRENT (SLOW)
const buildResult = await exec(
  `cd src/${nameOfProject} && docker compose build --no-cache`
);
```

**Problem:** `--no-cache` forces complete rebuild every time:
- Downloads base image layers
- Runs `npm install` from scratch
- No layer caching benefits

**Impact:** +60-120 seconds per submission

### Bottleneck #2: Inefficient Health Check Loop

**Location:** `worker/src/index.ts` lines 98-127

```typescript
// CURRENT (SLOW)
while (true) {
  try {
    const healthResponse = await axios.get("http://localhost:8000/health", { timeout: 2000 });
    break;
  } catch (err) {
    healthCheckAttempts++;
    if (healthCheckAttempts >= maxHealthCheckAttempts) {
      throw new Error("Service failed to become healthy");
    }
    await new Promise(resolve => setTimeout(resolve, 2000)); // Fixed 2s wait
    continue;
  }
}
```

**Problems:**
- Fixed 2-second intervals (minimum 4s per attempt)
- No exponential backoff
- Maximum 30 attempts = 60 second worst case

**Impact:** +2-60 seconds per submission

### Bottleneck #3: Single Worker Instance

**Location:** `worker/src/index.ts` line 27

```typescript
// CURRENT (SEQUENTIAL)
while (true) {
  const popped = await redisClient.brPop(REDIS_QUEUE_NAME, 0);
  // Process one at a time...
}
```

**Problem:** Only one submission processed at a time

**Impact:** Maximum throughput = 0.5 submissions/minute

---

## Three Optimization Approaches

### Approach 1: Pre-built Base Images + Warm Container Pool

**Concept:** Don't build Docker images per submission. Maintain a pool of pre-warmed containers.

#### Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      WARM CONTAINER POOL                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Pool Manager                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  │  │Container│ │Container│ │Container│ │Container│ │Container│   │   │
│  │  │  READY  │ │  READY  │ │  BUSY   │ │  READY  │ │  READY  │   │   │
│  │  │         │ │         │ │ Testing │ │         │ │         │   │   │
│  │  │ Node.js │ │ Node.js │ │ User123 │ │ Node.js │ │ Node.js │   │   │
│  │  │ Prisma  │ │ Prisma  │ │         │ │ Prisma  │ │ Prisma  │   │   │
│  │  │ Postgres│ │ Postgres│ │         │ │ Postgres│ │ Postgres│   │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Flow:                                                                   │
│  1. Acquire container from pool (instant)                               │
│  2. Copy student code into container (1-2s)                             │
│  3. Install deps + migrate (10-20s)                                     │
│  4. Start server + run tests (10-15s)                                   │
│  5. Release container back to pool                                      │
│                                                                          │
│  Total Time: 20-40 seconds (vs 120 seconds currently)                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Implementation

**Step 1: Create Base Dockerfile**

```dockerfile
# Dockerfile.base
FROM node:24-alpine

# Install system dependencies
RUN apk add --no-cache python3 make g++ postgresql-client

# Install global packages
RUN npm install -g pnpm prisma typescript

# Create app directory
WORKDIR /app

# Pre-install common dependencies (speeds up npm install)
COPY package.json.template package.json
RUN pnpm install

# Install PostgreSQL
RUN apk add --no-cache postgresql postgresql-contrib

# Initialize PostgreSQL
RUN mkdir -p /var/lib/postgresql/data && \
    chown -R postgres:postgres /var/lib/postgresql && \
    su postgres -c "initdb -D /var/lib/postgresql/data"

# Create startup script
COPY startup.sh /startup.sh
RUN chmod +x /startup.sh

EXPOSE 8000 5432

CMD ["/startup.sh"]
```

**Step 2: Container Pool Manager**

```typescript
// worker/src/containerPool.ts

import Docker from 'dockerode';

interface PooledContainer {
  id: string;
  container: Docker.Container;
  status: 'ready' | 'busy' | 'cleaning';
  lastUsed: Date;
}

class ContainerPool {
  private docker: Docker;
  private pool: Map<string, PooledContainer> = new Map();
  private minSize: number;
  private maxSize: number;
  private baseImage: string;

  constructor(options: {
    minSize?: number;
    maxSize?: number;
    baseImage: string;
  }) {
    this.docker = new Docker();
    this.minSize = options.minSize || 5;
    this.maxSize = options.maxSize || 20;
    this.baseImage = options.baseImage;
  }

  async initialize(): Promise<void> {
    console.log(`Initializing container pool with ${this.minSize} containers...`);

    const promises = [];
    for (let i = 0; i < this.minSize; i++) {
      promises.push(this.createContainer());
    }

    await Promise.all(promises);
    console.log(`Container pool initialized with ${this.pool.size} containers`);
  }

  private async createContainer(): Promise<PooledContainer> {
    const container = await this.docker.createContainer({
      Image: this.baseImage,
      Tty: true,
      HostConfig: {
        Memory: 512 * 1024 * 1024,  // 512MB
        CpuPeriod: 100000,
        CpuQuota: 100000,  // 1 CPU
        NetworkMode: 'bridge',
      },
      ExposedPorts: { '8000/tcp': {} },
    });

    await container.start();

    const pooledContainer: PooledContainer = {
      id: container.id,
      container,
      status: 'ready',
      lastUsed: new Date(),
    };

    this.pool.set(container.id, pooledContainer);
    return pooledContainer;
  }

  async acquire(): Promise<PooledContainer> {
    // Find a ready container
    for (const [id, container] of this.pool) {
      if (container.status === 'ready') {
        container.status = 'busy';
        container.lastUsed = new Date();
        return container;
      }
    }

    // No ready containers, create new one if under max
    if (this.pool.size < this.maxSize) {
      const newContainer = await this.createContainer();
      newContainer.status = 'busy';
      return newContainer;
    }

    // Pool exhausted, wait for one to become available
    return new Promise((resolve) => {
      const checkInterval = setInterval(async () => {
        for (const [id, container] of this.pool) {
          if (container.status === 'ready') {
            clearInterval(checkInterval);
            container.status = 'busy';
            container.lastUsed = new Date();
            resolve(container);
            return;
          }
        }
      }, 100);
    });
  }

  async release(pooledContainer: PooledContainer): Promise<void> {
    pooledContainer.status = 'cleaning';

    try {
      // Reset container state
      await this.resetContainer(pooledContainer.container);
      pooledContainer.status = 'ready';
    } catch (error) {
      // Container is broken, remove and create new one
      console.error(`Container ${pooledContainer.id} failed to reset, replacing...`);
      await pooledContainer.container.remove({ force: true });
      this.pool.delete(pooledContainer.id);
      await this.createContainer();
    }
  }

  private async resetContainer(container: Docker.Container): Promise<void> {
    // Kill any running processes
    const exec = await container.exec({
      Cmd: ['sh', '-c', 'pkill -f "node" || true'],
      AttachStdout: true,
      AttachStderr: true,
    });
    await exec.start({ hijack: true, stdin: false });

    // Clean up app directory
    const cleanExec = await container.exec({
      Cmd: ['sh', '-c', 'rm -rf /app/src/* /app/node_modules/.cache'],
      AttachStdout: true,
      AttachStderr: true,
    });
    await cleanExec.start({ hijack: true, stdin: false });

    // Reset database
    const dbExec = await container.exec({
      Cmd: ['sh', '-c', 'su postgres -c "dropdb --if-exists contest && createdb contest"'],
      AttachStdout: true,
      AttachStderr: true,
    });
    await dbExec.start({ hijack: true, stdin: false });
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down container pool...');
    for (const [id, container] of this.pool) {
      await container.container.stop();
      await container.container.remove();
    }
    this.pool.clear();
  }
}

export const containerPool = new ContainerPool({
  minSize: 5,
  maxSize: 20,
  baseImage: 'devforces-base:latest',
});
```

**Step 3: Updated Worker**

```typescript
// worker/src/index.ts (updated)

import { containerPool } from './containerPool';

async function processSubmission(submission: Submission) {
  const { id, challengeId, url } = submission;

  // 1. Download and extract (5-10s)
  const extractPath = await downloadAndExtract(url, id);

  // 2. Acquire warm container (instant)
  const container = await containerPool.acquire();

  try {
    // 3. Copy code to container (1-2s)
    await copyToContainer(container, extractPath, '/app/src');

    // 4. Install dependencies and migrate (10-20s)
    await execInContainer(container, `
      cd /app/src &&
      pnpm install --frozen-lockfile &&
      npx prisma migrate deploy
    `);

    // 5. Start server (2-5s)
    await execInContainer(container, `
      cd /app/src && npm start &
    `);

    // 6. Wait for health (1-5s with exponential backoff)
    await waitForHealthExponential(container, 'http://localhost:8000/health');

    // 7. Run tests (5-15s)
    const result = await runTests(container, challengeId);

    // 8. Publish results
    await publishResult(id, result);

  } finally {
    // 9. Release container back to pool
    await containerPool.release(container);

    // 10. Cleanup local files
    await cleanup(extractPath);
  }
}

async function waitForHealthExponential(
  container: PooledContainer,
  url: string,
  maxWaitMs = 30000
): Promise<void> {
  const start = Date.now();
  let delay = 100;  // Start with 100ms

  while (Date.now() - start < maxWaitMs) {
    try {
      await execInContainer(container, `curl -sf ${url}`);
      return;
    } catch {
      await sleep(delay);
      delay = Math.min(delay * 1.5, 2000);  // Exponential backoff, max 2s
    }
  }

  throw new Error(`Health check timeout after ${maxWaitMs}ms`);
}
```

#### Expected Performance

| Step | Before | After | Savings |
|------|--------|-------|---------|
| Docker Build | 60-120s | 0s (pre-built) | 60-120s |
| Container Start | 5-10s | 0s (pre-warmed) | 5-10s |
| Copy Code | 0s | 1-2s | -2s |
| Install Deps | (in build) | 10-20s | - |
| Health Check | 2-60s | 1-5s | 1-55s |
| **Total** | **~120s** | **20-40s** | **80-100s** |

#### Pros & Cons

| Pros | Cons |
|------|------|
| 3-5x faster execution | Memory overhead for warm containers |
| Predictable timing | Need to manage pool lifecycle |
| Easy horizontal scaling | Container state management complexity |
| Works with existing codebase | Requires base image maintenance |

---

### Approach 2: Firecracker microVMs

**Concept:** Use lightweight microVMs instead of Docker. Boot time < 125ms.

#### Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      FIRECRACKER microVM ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐                                                       │
│  │   Worker     │                                                       │
│  │   Process    │                                                       │
│  └──────┬───────┘                                                       │
│         │                                                                │
│         ▼                                                                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     Firecracker VMM                               │  │
│  │  ┌─────────────────────────────────────────────────────────────┐ │  │
│  │  │                                                              │ │  │
│  │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐            │ │  │
│  │  │  │  microVM   │  │  microVM   │  │  microVM   │            │ │  │
│  │  │  │  User A    │  │  User B    │  │  User C    │            │ │  │
│  │  │  │            │  │            │  │            │            │ │  │
│  │  │  │ Boot: <125ms│ │ Boot: <125ms│ │ Boot: <125ms│           │ │  │
│  │  │  │ RAM: 512MB │  │ RAM: 512MB │  │ RAM: 512MB │            │ │  │
│  │  │  │ vCPU: 2    │  │ vCPU: 2    │  │ vCPU: 2    │            │ │  │
│  │  │  │            │  │            │  │            │            │ │  │
│  │  │  │ ┌────────┐ │  │ ┌────────┐ │  │ ┌────────┐ │            │ │  │
│  │  │  │ │Node.js │ │  │ │Node.js │ │  │ │Node.js │ │            │ │  │
│  │  │  │ │Postgres│ │  │ │Postgres│ │  │ │Postgres│ │            │ │  │
│  │  │  │ │Student │ │  │ │Student │ │  │ │Student │ │            │ │  │
│  │  │  │ │ Code   │ │  │ │ Code   │ │  │ │ Code   │ │            │ │  │
│  │  │  │ └────────┘ │  │ └────────┘ │  │ └────────┘ │            │ │  │
│  │  │  └────────────┘  └────────────┘  └────────────┘            │ │  │
│  │  │                                                              │ │  │
│  │  │  Kernel-level isolation (KVM)                               │ │  │
│  │  │  No container escape possible                               │ │  │
│  │  │  ~1000 VMs per host                                         │ │  │
│  │  └─────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Implementation

**Step 1: Build Root Filesystem**

```bash
#!/bin/bash
# build-rootfs.sh

# Create ext4 filesystem image
dd if=/dev/zero of=contest-rootfs.ext4 bs=1M count=2048
mkfs.ext4 contest-rootfs.ext4

# Mount and populate
mkdir -p /mnt/rootfs
mount contest-rootfs.ext4 /mnt/rootfs

# Install Alpine base
docker export $(docker create alpine:latest) | tar -C /mnt/rootfs -xf -

# Install Node.js, PostgreSQL, etc.
chroot /mnt/rootfs /bin/sh <<EOF
apk add --no-cache nodejs npm postgresql postgresql-contrib
npm install -g pnpm prisma
mkdir -p /app
EOF

# Unmount
umount /mnt/rootfs
```

**Step 2: Firecracker Worker**

```typescript
// worker/src/firecrackerWorker.ts

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

interface FirecrackerConfig {
  kernelPath: string;
  rootfsPath: string;
  memSizeMib: number;
  vcpuCount: number;
}

class FirecrackerVM {
  private socketPath: string;
  private process: any;
  private config: FirecrackerConfig;

  constructor(config: FirecrackerConfig) {
    this.config = config;
    this.socketPath = `/tmp/firecracker-${Date.now()}.sock`;
  }

  async start(): Promise<void> {
    // Start Firecracker process
    this.process = spawn('firecracker', [
      '--api-sock', this.socketPath
    ]);

    // Wait for socket
    await this.waitForSocket();

    // Configure VM
    await this.configureVM();

    // Start VM
    await this.startVM();
  }

  private async waitForSocket(): Promise<void> {
    for (let i = 0; i < 50; i++) {
      try {
        await fs.access(this.socketPath);
        return;
      } catch {
        await new Promise(r => setTimeout(r, 10));
      }
    }
    throw new Error('Firecracker socket timeout');
  }

  private async configureVM(): Promise<void> {
    // Set kernel
    await this.apiCall('PUT', '/boot-source', {
      kernel_image_path: this.config.kernelPath,
      boot_args: 'console=ttyS0 reboot=k panic=1 pci=off'
    });

    // Set rootfs
    await this.apiCall('PUT', '/drives/rootfs', {
      drive_id: 'rootfs',
      path_on_host: this.config.rootfsPath,
      is_root_device: true,
      is_read_only: false
    });

    // Set machine config
    await this.apiCall('PUT', '/machine-config', {
      vcpu_count: this.config.vcpuCount,
      mem_size_mib: this.config.memSizeMib
    });

    // Set network (tap device)
    await this.apiCall('PUT', '/network-interfaces/eth0', {
      iface_id: 'eth0',
      guest_mac: this.generateMac(),
      host_dev_name: 'tap0'
    });
  }

  private async startVM(): Promise<void> {
    await this.apiCall('PUT', '/actions', {
      action_type: 'InstanceStart'
    });
  }

  private async apiCall(method: string, path: string, body: any): Promise<any> {
    const { stdout } = await execAsync(`
      curl -s --unix-socket ${this.socketPath} \
        -X ${method} \
        -H "Content-Type: application/json" \
        -d '${JSON.stringify(body)}' \
        http://localhost${path}
    `);
    return JSON.parse(stdout || '{}');
  }

  async exec(command: string): Promise<{ stdout: string; stderr: string }> {
    // Execute command via serial console or SSH
    // Implementation depends on your setup
    const { stdout, stderr } = await execAsync(`
      ssh -o StrictHostKeyChecking=no root@${this.ipAddress} "${command}"
    `);
    return { stdout, stderr };
  }

  async copyFile(localPath: string, remotePath: string): Promise<void> {
    await execAsync(`
      scp -o StrictHostKeyChecking=no ${localPath} root@${this.ipAddress}:${remotePath}
    `);
  }

  async stop(): Promise<void> {
    await this.apiCall('PUT', '/actions', {
      action_type: 'SendCtrlAltDel'
    });
    this.process.kill();
    await fs.unlink(this.socketPath).catch(() => {});
  }

  private generateMac(): string {
    const hex = '0123456789ABCDEF';
    let mac = 'AA:FC:00';
    for (let i = 0; i < 3; i++) {
      mac += ':' + hex[Math.floor(Math.random() * 16)] + hex[Math.floor(Math.random() * 16)];
    }
    return mac;
  }

  private ipAddress: string = '';
}

// Main worker using Firecracker
async function processWithFirecracker(submission: Submission) {
  const vm = new FirecrackerVM({
    kernelPath: '/var/lib/firecracker/vmlinux',
    rootfsPath: '/var/lib/firecracker/contest-rootfs.ext4',
    memSizeMib: 512,
    vcpuCount: 2
  });

  try {
    // 1. Start VM (< 125ms)
    await vm.start();

    // 2. Copy student code
    await vm.copyFile(submission.extractPath, '/app/src');

    // 3. Install and run
    await vm.exec(`
      cd /app/src &&
      pnpm install &&
      npx prisma migrate deploy &&
      npm start &
    `);

    // 4. Wait for health
    await waitForHealth(vm);

    // 5. Run tests
    const result = await runTests(vm);

    return result;

  } finally {
    await vm.stop();
  }
}
```

**Step 3: VM Pool with Snapshots**

```typescript
// worker/src/vmPool.ts

class FirecrackerPool {
  private baseSnapshot: string;
  private activeVMs: Map<string, FirecrackerVM> = new Map();

  async initialize(): Promise<void> {
    // Create a base VM, set it up, then snapshot it
    const baseVM = new FirecrackerVM({ /* config */ });
    await baseVM.start();

    // Install all dependencies
    await baseVM.exec('npm install -g pnpm prisma');

    // Create snapshot (Firecracker supports this natively)
    await this.createSnapshot(baseVM, 'base-snapshot');
    await baseVM.stop();

    this.baseSnapshot = 'base-snapshot';
  }

  async acquire(): Promise<FirecrackerVM> {
    // Restore from snapshot (< 5ms!)
    const vm = await this.restoreFromSnapshot(this.baseSnapshot);
    this.activeVMs.set(vm.id, vm);
    return vm;
  }

  async release(vm: FirecrackerVM): Promise<void> {
    // Simply destroy the VM (no need to clean, snapshots are immutable)
    await vm.stop();
    this.activeVMs.delete(vm.id);
  }
}
```

#### Expected Performance

| Step | Before | After | Savings |
|------|--------|-------|---------|
| VM/Container Start | 60-120s | < 125ms | ~120s |
| Copy Code | 0s | 1-2s | -2s |
| Install Deps | (in build) | 10-15s | - |
| Health Check | 2-60s | 1-3s | 1-57s |
| **Total** | **~120s** | **15-25s** | **~100s** |

#### Pros & Cons

| Pros | Cons |
|------|------|
| Fastest isolation (< 125ms boot) | Linux-only (requires KVM) |
| Best security (kernel-level isolation) | More complex setup |
| Used by AWS Lambda, Fly.io | Requires custom rootfs |
| Snapshot restore in < 5ms | Learning curve |
| Can run 1000+ VMs per host | Network setup complexity |

---

### Approach 3: Sandboxed Runtime (No Docker)

**Concept:** Run student code in sandboxed Node.js processes without Docker overhead.

#### Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SANDBOXED RUNTIME ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        Worker Process                             │  │
│  │                                                                    │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │                    Sandbox Manager                          │  │  │
│  │  │                                                              │  │  │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │  │  │
│  │  │  │  Sandbox 1   │  │  Sandbox 2   │  │  Sandbox 3   │     │  │  │
│  │  │  │              │  │              │  │              │     │  │  │
│  │  │  │  nsjail /    │  │  nsjail /    │  │  nsjail /    │     │  │  │
│  │  │  │  firejail    │  │  firejail    │  │  firejail    │     │  │  │
│  │  │  │              │  │              │  │              │     │  │  │
│  │  │  │  ┌────────┐  │  │  ┌────────┐  │  │  ┌────────┐  │     │  │  │
│  │  │  │  │Node.js │  │  │  │Node.js │  │  │  │Node.js │  │     │  │  │
│  │  │  │  │Process │  │  │  │Process │  │  │  │Process │  │     │  │  │
│  │  │  │  └────────┘  │  │  └────────┘  │  │  └────────┘  │     │  │  │
│  │  │  │              │  │              │  │              │     │  │  │
│  │  │  │  Limits:     │  │  Limits:     │  │  Limits:     │     │  │  │
│  │  │  │  - 512MB RAM │  │  - 512MB RAM │  │  - 512MB RAM │     │  │  │
│  │  │  │  - 30s CPU   │  │  - 30s CPU   │  │  - 30s CPU   │     │  │  │
│  │  │  │  - No network│  │  - No network│  │  - No network│     │  │  │
│  │  │  └──────────────┘  └──────────────┘  └──────────────┘     │  │  │
│  │  │                                                              │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  │                                                                    │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │                    Shared PostgreSQL                        │  │  │
│  │  │                                                              │  │  │
│  │  │  Schema: submission_abc123  │  Schema: submission_def456   │  │  │
│  │  │  (isolated per submission)  │  (isolated per submission)   │  │  │
│  │  │                                                              │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  │                                                                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Implementation

**Step 1: Sandbox Executor using nsjail**

```typescript
// worker/src/sandbox.ts

import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';

interface SandboxConfig {
  workDir: string;
  memoryLimitMb: number;
  cpuTimeLimitSec: number;
  wallTimeLimitSec: number;
  networkAccess: boolean;
}

class Sandbox {
  private config: SandboxConfig;
  private schemaName: string;

  constructor(config: SandboxConfig) {
    this.config = config;
    this.schemaName = `submission_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  async setup(): Promise<void> {
    // Create isolated database schema
    await this.createSchema();
  }

  private async createSchema(): Promise<void> {
    const { execAsync } = await import('./utils');
    await execAsync(`psql -c "CREATE SCHEMA ${this.schemaName}"`);
  }

  async run(command: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      const nsjailArgs = [
        '--mode', 'o',                              // Once mode
        '--chroot', this.config.workDir,            // Chroot to work directory
        '--user', '65534',                          // Nobody user
        '--group', '65534',                         // Nobody group
        '--time_limit', String(this.config.wallTimeLimitSec),
        '--rlimit_as', String(this.config.memoryLimitMb),
        '--rlimit_cpu', String(this.config.cpuTimeLimitSec),
        '--rlimit_fsize', '100',                    // 100MB max file size
        '--rlimit_nofile', '256',                   // Max open files
        '--disable_proc',                           // No /proc access
        '--iface_no_lo',                            // No loopback (unless needed)
        this.config.networkAccess ? '' : '--iface_no_lo',
        '--env', `DATABASE_URL=postgresql://postgres:password@host.docker.internal:5432/postgres?schema=${this.schemaName}`,
        '--env', 'NODE_ENV=production',
        '--', '/bin/sh', '-c', command
      ].filter(Boolean);

      const proc = spawn('nsjail', nsjailArgs);

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => { stdout += data; });
      proc.stderr.on('data', (data) => { stderr += data; });

      proc.on('close', (exitCode) => {
        resolve({ stdout, stderr, exitCode: exitCode || 0 });
      });

      proc.on('error', reject);
    });
  }

  async cleanup(): Promise<void> {
    // Drop the isolated schema
    const { execAsync } = await import('./utils');
    await execAsync(`psql -c "DROP SCHEMA IF EXISTS ${this.schemaName} CASCADE"`);

    // Clean up work directory
    await fs.rm(this.config.workDir, { recursive: true, force: true });
  }

  getDbUrl(): string {
    return `postgresql://postgres:password@localhost:5432/postgres?schema=${this.schemaName}`;
  }
}

export { Sandbox, SandboxConfig };
```

**Step 2: Worker with Sandboxed Execution**

```typescript
// worker/src/sandboxWorker.ts

import { Sandbox } from './sandbox';
import { downloadAndExtract, runTests, publishResult } from './utils';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as net from 'net';

async function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, () => {
      const port = (server.address() as net.AddressInfo).port;
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

async function processWithSandbox(submission: Submission) {
  const workDir = `/tmp/submissions/${submission.id}`;
  const port = await getAvailablePort();

  // 1. Extract submission (2-5s)
  await downloadAndExtract(submission.url, workDir);

  // 2. Create sandbox
  const sandbox = new Sandbox({
    workDir,
    memoryLimitMb: 512,
    cpuTimeLimitSec: 60,
    wallTimeLimitSec: 120,
    networkAccess: true  // Need network for DB and tests
  });

  try {
    await sandbox.setup();

    // 3. Install dependencies (5-15s)
    const installResult = await sandbox.run(`
      cd /app &&
      npm install --omit=dev
    `);

    if (installResult.exitCode !== 0) {
      throw new Error(`Install failed: ${installResult.stderr}`);
    }

    // 4. Run Prisma migrations (2-5s)
    const migrateResult = await sandbox.run(`
      cd /app &&
      DATABASE_URL="${sandbox.getDbUrl()}" npx prisma migrate deploy
    `);

    // 5. Start server in background
    // Note: For sandboxed execution, we start the server and then run tests
    const serverProcess = spawn('nsjail', [
      '--mode', 'o',
      '--chroot', workDir,
      '--time_limit', '120',
      '--env', `DATABASE_URL=${sandbox.getDbUrl()}`,
      '--env', `PORT=${port}`,
      '--', 'node', 'dist/index.js'
    ]);

    // 6. Wait for health (1-5s)
    await waitForHealth(`http://localhost:${port}/health`, 30000);

    // 7. Run tests against the sandboxed server (5-15s)
    const result = await runTestsAgainstServer(`http://localhost:${port}`, submission.challengeId);

    // 8. Kill server
    serverProcess.kill();

    // 9. Publish results
    await publishResult(submission.id, result);

    return result;

  } finally {
    await sandbox.cleanup();
  }
}

async function waitForHealth(url: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  let delay = 50;

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (response.ok) return;
    } catch {
      // Continue waiting
    }
    await new Promise(r => setTimeout(r, delay));
    delay = Math.min(delay * 1.5, 1000);
  }

  throw new Error(`Health check timeout after ${timeoutMs}ms`);
}
```

**Step 3: Alternative - Using isolated-vm for Pure JS**

```typescript
// For simpler cases where you only need to run JS code
// worker/src/isolatedWorker.ts

import ivm from 'isolated-vm';

async function runInIsolate(code: string, testCode: string): Promise<any> {
  const isolate = new ivm.Isolate({ memoryLimit: 128 }); // 128MB limit
  const context = await isolate.createContext();

  // Inject limited globals
  const jail = context.global;
  await jail.set('global', jail.derefInto());

  // Run student code
  const studentScript = await isolate.compileScript(code);
  await studentScript.run(context, { timeout: 5000 }); // 5s timeout

  // Run tests
  const testScript = await isolate.compileScript(testCode);
  const result = await testScript.run(context, { timeout: 30000 }); // 30s timeout

  isolate.dispose();

  return result;
}
```

#### Expected Performance

| Step | Before | After | Savings |
|------|--------|-------|---------|
| Docker Build | 60-120s | 0s | 60-120s |
| Container Start | 5-10s | 0s | 5-10s |
| Process Start | 0s | < 100ms | - |
| Install Deps | (in build) | 5-15s | - |
| Health Check | 2-60s | 1-5s | 1-55s |
| **Total** | **~120s** | **10-25s** | **~100s** |

#### Pros & Cons

| Pros | Cons |
|------|------|
| Fastest option (no VM/container overhead) | Less isolation than containers |
| Simple to implement | Need to handle DB isolation separately |
| Works on any platform | nsjail is Linux-only |
| Minimal resource usage | May not support all student code patterns |
| Easy to scale horizontally | Security depends on sandbox config |

---

## Quick Wins (Immediate Fixes)

Before implementing any major approach, apply these quick fixes to your current codebase:

### Fix 1: Remove `--no-cache` Flag

```typescript
// worker/src/index.ts line 46

// BEFORE
const buildResult = await exec(
  `cd src/${nameOfProject} && docker compose build --no-cache`
);

// AFTER
const buildResult = await exec(
  `cd src/${nameOfProject} && docker compose build`
);
```

**Impact:** -30-60 seconds (uses Docker layer cache)

### Fix 2: Exponential Backoff for Health Checks

```typescript
// worker/src/index.ts - Replace lines 98-127

async function waitForHealthExponential(
  url: string,
  maxWaitMs: number = 30000
): Promise<void> {
  const start = Date.now();
  let delay = 100;  // Start with 100ms instead of 2000ms
  let attempts = 0;

  while (Date.now() - start < maxWaitMs) {
    try {
      const response = await axios.get(url, { timeout: 1000 });
      if (response.status === 200) {
        console.log(`Health check passed after ${attempts} attempts`);
        return;
      }
    } catch {
      // Continue
    }

    attempts++;
    await new Promise(resolve => setTimeout(resolve, delay));
    delay = Math.min(delay * 1.5, 2000);  // Exponential backoff, max 2s
  }

  throw new Error(`Health check failed after ${maxWaitMs}ms (${attempts} attempts)`);
}
```

**Impact:** -10-30 seconds (faster initial checks)

### Fix 3: Add Parallel Workers

```typescript
// worker/src/index.ts

// Instead of single blocking loop, use worker threads or multiple processes
import { Worker, isMainThread, workerData } from 'worker_threads';

if (isMainThread) {
  // Spawn multiple workers
  const WORKER_COUNT = 5;

  for (let i = 0; i < WORKER_COUNT; i++) {
    new Worker(__filename, { workerData: { workerId: i } });
  }
} else {
  // Worker logic
  const { workerId } = workerData;
  console.log(`Worker ${workerId} started`);

  // Each worker runs its own processing loop
  processSubmissions();
}
```

**Impact:** 5x throughput (parallel processing)

### Fix 4: Add Timeouts

```typescript
// worker/src/index.ts

import { execWithTimeout } from './utils';

// Add timeout wrapper
async function execWithTimeout(
  command: string,
  timeoutMs: number
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = exec(command, { timeout: timeoutMs });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', d => stdout += d);
    proc.stderr?.on('data', d => stderr += d);

    proc.on('close', () => resolve({ stdout, stderr }));
    proc.on('error', reject);
  });
}

// Use it
const buildResult = await execWithTimeout(
  `cd src/${nameOfProject} && docker compose build`,
  180000  // 3 minute timeout
);
```

**Impact:** Prevents zombie processes

---

## Comparison Matrix

| Criteria | Current | Approach 1 (Containers) | Approach 2 (Firecracker) | Approach 3 (Sandbox) |
|----------|---------|-------------------------|--------------------------|----------------------|
| **Response Time** | ~120s | 20-40s | 15-25s | 10-25s |
| **Security** | High | High | Highest | Medium |
| **Complexity** | Medium | Medium | High | Low |
| **Cost** | Medium | Medium | Low | Lowest |
| **Scalability** | Low | High | Highest | High |
| **Platform** | Any | Any | Linux only | Linux (nsjail) |
| **Setup Time** | - | 1-2 days | 3-5 days | 0.5-1 day |

---

## Recommended Implementation Path

### Phase 1: Quick Wins (Day 1)
1. Remove `--no-cache` flag
2. Implement exponential backoff health checks
3. Add timeouts to all exec calls

**Expected Result:** ~60-80 seconds (from 120s)

### Phase 2: Parallel Workers (Day 2-3)
1. Implement worker pool (5-10 workers)
2. Add proper error handling and retry logic
3. Monitor and tune

**Expected Result:** 5-10x throughput

### Phase 3: Container Pool (Week 1-2)
1. Build base Docker image
2. Implement container pool manager
3. Update worker to use pool

**Expected Result:** ~20-40 seconds per submission

### Phase 4: Firecracker (Optional, Week 3-4)
1. Only if you need highest security/scale
2. Build custom rootfs
3. Implement VM pool with snapshots

**Expected Result:** ~15-25 seconds, 1000+ concurrent

---

## Capacity Planning for 10,000 Students

### Assumptions
- Contest duration: 3 hours
- Average submissions per student: 5
- Total submissions: 50,000
- Peak rate: ~300 submissions/minute (assuming 60% in last hour)

### Current System
- Processing time: 120s per submission
- Workers: 1
- Capacity: 0.5 submissions/minute
- **VERDICT: Cannot handle load**

### With Quick Wins + 10 Workers
- Processing time: 60s per submission
- Workers: 10
- Capacity: 10 submissions/minute
- Time to clear 50K: 83 hours
- **VERDICT: Still too slow**

### With Approach 1 (Container Pool) + 20 Workers
- Processing time: 30s per submission
- Workers: 20
- Capacity: 40 submissions/minute
- Time to clear 50K: 21 hours
- **VERDICT: Needs more workers or faster processing**

### With Approach 2 (Firecracker) + 50 Workers
- Processing time: 20s per submission
- Workers: 50
- Capacity: 150 submissions/minute
- Time to clear 50K: 5.5 hours
- **VERDICT: Acceptable for 3-hour contest with buffer**

### Recommendation for 10K Students
- Use Approach 1 with 30-50 container workers
- Or use Approach 2 with 20-30 VM workers
- Deploy on machines with 32+ cores and 64GB+ RAM
- Consider auto-scaling based on queue depth

---

## Conclusion

The DevForces architecture is **well-designed** but needs optimization for scale:

1. **Immediate:** Apply quick wins (remove --no-cache, exponential backoff)
2. **Short-term:** Implement container pool (Approach 1)
3. **Long-term:** Consider Firecracker for best scale (Approach 2)

For 10,000 students, you'll need **30-50 parallel workers** with **20-40 second processing time** to handle peak load comfortably.
