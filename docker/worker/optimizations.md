# Docker Image Optimization Guide - Worker Service

> **Service:** Worker  
> **Current Issues:** Similar to Web service - copying entire build output to runner  
> **Potential Savings:** ~500-900 MB

---

## 🎯 Major Optimizations (Biggest Impact)

### 1. Don't Copy the Entire Build Output to Runner

**Current Issue:**  
Line 32 copies everything from the builder stage (`COPY --from=builder /app .`), including:
- All `node_modules` (both dev and prod dependencies)
- Source files (TypeScript files, tests, etc.)
- Build artifacts from other packages
- pnpm cache and store
- Prisma generate outputs that may not be needed

**Optimization:**  
Only copy what's needed to run the worker:
```dockerfile
# Copy only the built worker application
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist

# Copy only production dependencies (see optimization #2)
COPY --from=builder /app/node_modules ./node_modules

# Copy Prisma client if needed
COPY --from=builder /app/packages/db/node_modules/.prisma ./packages/db/node_modules/.prisma
COPY --from=builder /app/packages/db/node_modules/@prisma ./packages/db/node_modules/@prisma

# Copy package.json files for module resolution
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/worker/package.json ./apps/worker/package.json
COPY --from=builder /app/packages/db/package.json ./packages/db/package.json
```

**Expected Savings:** 400-600 MB

---

### 2. Install Only Production Dependencies in Runner

**Current Issue:**  
The runner stage copies all dependencies from builder, including dev dependencies like TypeScript, testing libraries, build tools, etc.

**Optimization:**  
In the runner stage, install only production dependencies:
```dockerfile
FROM node:${NODE_VERSION}-alpine AS runner

WORKDIR /app

# Install pnpm (needed only for installation)
RUN npm install -g pnpm

# Copy package files
COPY --from=prepare /app/out/json/ .

# Install ONLY production dependencies
RUN pnpm install --prod --frozen-lockfile

# Generate Prisma client (prod only)
RUN cd packages/db && pnpm dlx prisma@6.3.0 generate

# Copy built application
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist

# Remove pnpm to save space
RUN npm uninstall -g pnpm && npm cache clean --force
```

**Expected Savings:** 200-350 MB

---

### 3. Use Multi-Stage Build Cleanup

**Current Issue:**  
Package manager caches and temporary files are left in the image layers.

**Optimization:**  
Add cleanup commands after installations:
```dockerfile
# In builder stage
RUN pnpm install && pnpm store prune

# After Prisma generate
RUN cd packages/db && pnpm dlx prisma@6.3.0 generate && rm -rf /root/.cache
```

**Expected Savings:** 50-100 MB

---

## 📦 Medium Impact Optimizations

### 4. Use `--mount=type=cache` for pnpm

Use BuildKit cache mounts to avoid storing pnpm cache in image layers.

**Implementation:**
```dockerfile
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
```

> [!NOTE]
> Requires Docker BuildKit: `DOCKER_BUILDKIT=1 docker build`

**Expected Savings:** 40-80 MB

---

### 5. Minimize Layer Size with `.dockerignore`

**Recommended `.dockerignore` contents:**
```
node_modules
.next
.turbo
dist
build
**/*.log
**/.DS_Store
.git
.env*
**/coverage
**/*.test.ts
**/*.spec.ts
apps/web
apps/admin
```

**Expected Savings:** 100-200 MB

---

### 6. Optimize Prisma Generation

**Current Issue:**  
Line 25 runs Prisma generate which creates client files that might include unnecessary artifacts.

**Optimization:**
```dockerfile
# Only generate what's needed, and clean up afterwards
RUN cd packages/db && \
    pnpm dlx prisma@6.3.0 generate && \
    rm -rf /root/.cache /tmp/*
```

**Expected Savings:** 20-40 MB

---

## 🔧 Smaller Optimizations

### 7. Remove Unnecessary Global Packages in Runner

**Issue:**  
The runner stage doesn't need `turbo` or `pnpm` at runtime (only needed during build).

**Optimization:**  
Don't install global packages in runner, or remove them after use:
```dockerfile
RUN npm uninstall -g pnpm && npm cache clean --force
```

**Expected Savings:** 15-30 MB

---

### 8. Combine RUN Commands

**Optimization:**  
Reduce layer count by combining related commands:
```dockerfile
# In prepare stage
RUN npm install -g turbo && turbo prune worker --docker

# In builder stage
RUN npm install -g pnpm && \
    pnpm install && \
    pnpm store prune
```

**Expected Savings:** Minimal, improves build efficiency

---

### 9. Use Docker Init for Proper Signal Handling

**Issue:**  
Node.js in container doesn't handle signals properly (important for graceful shutdown of workers).

**Optimization:**  
Use `--init` flag when running, or use `tini`:
```dockerfile
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/worker/dist/index.js"]
```

**Expected Savings:** ~2 MB (but critical for production)

---

### 10. Consider Alpine Base Optimizations

**Current:** Using `node:24.11.0-alpine`

**Additional Optimization:**  
Clean up apk cache if installing any packages:
```dockerfile
RUN apk add --no-cache tini && rm -rf /var/cache/apk/*
```

**Expected Savings:** 5-10 MB

---

## 📊 Expected Results

### Optimization Priority

| Priority | Optimizations | Expected Savings |
|----------|---------------|------------------|
| **HIGH** | #1, #2 | 600-950 MB |
| **MEDIUM** | + #3, #4, #5, #6 | +210-420 MB |
| **ALL** | All optimizations | 815-1370 MB total |

### Recommended Implementation Order

1. **Phase 1:** Add `.dockerignore` (#5) - Quick win, prevents unnecessary files in build context
2. **Phase 2:** Implement #1 (selective copy) + #2 (prod deps only) - Major impact
3. **Phase 3:** Add #3 (cleanup), #4 (cache mounts), #6 (Prisma optimization)
4. **Phase 4:** Add #7, #8, #9 (signal handling), #10 (Alpine optimizations)

---

## 🎯 Key Takeaway

> [!IMPORTANT]
> The **most critical changes** for Worker service:
> 1. Copy only the compiled `dist` folder, not entire source
> 2. Install production dependencies only in runner stage
> 3. Properly handle cleanup after Prisma generation
>
> These three changes alone can reduce image size by **600-950 MB**

---

## 🐳 Optimized Dockerfile Example

```dockerfile
ARG NODE_VERSION=24.11.0
FROM node:${NODE_VERSION}-alpine AS base

FROM base AS prepare 
WORKDIR /app
RUN npm install -g turbo
COPY . . 
RUN turbo prune worker --docker

FROM base AS builder 
WORKDIR /app 
RUN npm install -g pnpm 
COPY --from=prepare /app/out/json/ . 
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY --from=prepare /app/out/full/ . 
RUN cd packages/db && pnpm dlx prisma@6.3.0 generate && rm -rf /root/.cache
RUN pnpm build && pnpm store prune

FROM base AS runner
WORKDIR /app

# Install tini for signal handling
RUN apk add --no-cache tini

# Copy package files for prod install
COPY --from=prepare /app/out/json/ .
RUN npm install -g pnpm && \
    pnpm install --prod --frozen-lockfile && \
    cd packages/db && pnpm dlx prisma@6.3.0 generate && \
    npm uninstall -g pnpm && \
    npm cache clean --force && \
    rm -rf /root/.cache /tmp/*

# Copy only built application
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/worker/dist/index.js"]
```

---

## 📚 Additional Resources

- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Docker BuildKit Cache Mounts](https://docs.docker.com/build/cache/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Tini - Container Init](https://github.com/krallin/tini)

---

**Last Updated:** 2026-01-03  
**Dockerfile Location:** `/home/nagmani/root/projects/devforces/docker/worker/Dockerfile`
