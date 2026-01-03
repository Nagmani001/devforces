# Docker Image Optimization Guide - Backend Service

> **Service:** Backend (Express API)  
> **Current Issues:** Copying entire build output, all dependencies, unnecessary files  
> **Potential Savings:** ~500-900 MB

---

## 🎯 Major Optimizations (Biggest Impact)

### 1. Don't Copy the Entire Build Output to Runner

**Current Issue:**  
Line 31 copies everything from the builder stage (`COPY --from=builder /app .`), including:
- All `node_modules` (both dev and prod dependencies)
- Source TypeScript files
- Test files
- Build artifacts from other packages
- pnpm cache and store
- Unnecessary Prisma artifacts

**Optimization:**  
Only copy what's needed to run the backend API:
```dockerfile
# Copy only the built backend application
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Copy Prisma client (required for database operations)
COPY --from=builder /app/packages/db/node_modules/.prisma ./packages/db/node_modules/.prisma
COPY --from=builder /app/packages/db/node_modules/@prisma ./packages/db/node_modules/@prisma

# Copy package.json files for module resolution
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /app/packages/db/package.json ./packages/db/package.json

# Copy shared packages if used
COPY --from=builder /app/packages/common ./packages/common
```

**Expected Savings:** 400-600 MB

---

### 2. Install Only Production Dependencies in Runner

**Current Issue:**  
The runner stage copies all dependencies from builder, including:
- TypeScript and ts-node
- Testing libraries (Jest, Vitest)
- Linters and formatters
- Build tools
- Dev-only utilities

**Optimization:**  
Install only production dependencies in the runner stage:
```dockerfile
FROM node:${NODE_VERSION}-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm

# Copy package files
COPY --from=prepare /app/out/json/ .

# Install ONLY production dependencies
RUN pnpm install --prod --frozen-lockfile

# Generate Prisma client for production
RUN cd packages/db && pnpm dlx prisma@6.3.0 generate

# Copy built application
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Cleanup
RUN npm uninstall -g pnpm && \
    npm cache clean --force && \
    rm -rf /root/.cache /tmp/*
```

**Expected Savings:** 200-400 MB

---

### 3. Use Multi-Stage Build Cleanup

**Current Issue:**  
Package manager caches remain in image layers, inflating size.

**Optimization:**  
Add cleanup commands after each major installation:
```dockerfile
# In builder stage
RUN pnpm install && pnpm store prune

# After Prisma generate
RUN cd packages/db && \
    pnpm dlx prisma@6.3.0 generate && \
    rm -rf /root/.cache /tmp/*

# After build
RUN pnpm build && \
    rm -rf /root/.npm /root/.cache
```

**Expected Savings:** 50-120 MB

---

## 📦 Medium Impact Optimizations

### 4. Use `--mount=type=cache` for pnpm

Use BuildKit cache mounts to keep pnpm cache out of final image.

**Implementation:**
```dockerfile
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile
```

> [!NOTE]
> Enable BuildKit: `DOCKER_BUILDKIT=1 docker build -t backend .`

**Expected Savings:** 40-90 MB

---

### 5. Minimize Layer Size with `.dockerignore`

Prevent unnecessary files from entering the build context.

**Recommended `.dockerignore` contents:**
```
node_modules
dist
build
.next
.turbo
**/*.log
**/.DS_Store
.git
.gitignore
.env*
.vscode
.idea
**/coverage
**/test
**/*.test.ts
**/*.spec.ts
**/__tests__
apps/web
apps/worker
README.md
*.md
docker-compose*.yml
.github
```

**Expected Savings:** 100-250 MB

---

### 6. Optimize Prisma Client Generation

**Current Issue:**  
Prisma generates client with all engines and query logs.

**Optimization:**
```dockerfile
# Set environment variables to optimize Prisma
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
ENV PRISMA_GENERATE_SKIP_AUTOINSTALL=true

# Generate only what's needed
RUN cd packages/db && \
    pnpm dlx prisma@6.3.0 generate && \
    rm -rf /root/.cache /root/.npm
```

**Expected Savings:** 30-50 MB

---

### 7. Remove Source Maps in Production

**Optimization:**  
Configure TypeScript build to skip source maps in production builds:

In `tsconfig.json`:
```json
{
  "compilerOptions": {
    "sourceMap": false  // for production
  }
}
```

Or use build command:
```dockerfile
RUN pnpm build --no-sourcemap
```

**Expected Savings:** 20-40 MB

---

## 🔧 Smaller Optimizations

### 8. Remove Unnecessary Global Packages in Runner

**Issue:**  
Runner doesn't need build tools like `turbo` or `pnpm` at runtime.

**Optimization:**
```dockerfile
# After using pnpm for install in runner
RUN npm uninstall -g pnpm && \
    npm cache clean --force
```

**Expected Savings:** 15-35 MB

---

### 9. Combine RUN Commands

**Optimization:**  
Reduce Docker layer count:
```dockerfile
# In prepare stage
RUN npm install -g turbo && \
    turbo prune backend --docker

# In builder stage  
RUN npm install -g pnpm && \
    pnpm install && \
    pnpm store prune && \
    cd packages/db && \
    pnpm dlx prisma@6.3.0 generate && \
    pnpm build
```

**Expected Savings:** Minimal, improves caching

---

### 10. Add Health Check Optimization

**Optimization:**  
Use lightweight healthcheck:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"
```

**Expected Savings:** 0 MB, but improves reliability

---

### 11. Use Node.js in Production Mode

**Optimization:**
```dockerfile
ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "apps/backend/dist/index.js"]
```

**Expected Savings:** Better performance, slightly less memory

---

## 📊 Expected Results

### Optimization Priority

| Priority | Optimizations | Expected Savings |
|----------|---------------|------------------|
| **HIGH** | #1, #2 | 600-1000 MB |
| **MEDIUM** | + #3, #4, #5, #6, #7 | +240-550 MB |
| **ALL** | All optimizations | 840-1550 MB total |

### Recommended Implementation Order

1. **Phase 1:** Create comprehensive `.dockerignore` (#5) - Prevents bloat at source
2. **Phase 2:** Implement #1 (selective copy) + #2 (prod deps only) - Biggest impact
3. **Phase 3:** Add #3 (cleanup), #4 (cache mounts), #6 (Prisma optimization)
4. **Phase 4:** Add #7, #8, #9, #10, #11 - Polish and production readiness

---

## 🎯 Key Takeaway

> [!IMPORTANT]
> The **most critical optimizations** for Backend service:
> 1. Copy only compiled `dist` folder to runner (not entire source)
> 2. Install production-only dependencies in runner stage
> 3. Ensure Prisma client is properly generated and optimized
>
> These three changes can reduce image size by **600-1000 MB** (~60-70% reduction)

---

## 🐳 Optimized Dockerfile Example

```dockerfile
ARG NODE_VERSION=24.11.0
FROM node:${NODE_VERSION}-alpine AS base

FROM base AS prepare 
WORKDIR /app
RUN npm install -g turbo
COPY . . 
RUN turbo prune backend --docker

FROM base AS builder 
WORKDIR /app 

# Set Prisma optimization flags
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true

RUN npm install -g pnpm 
COPY --from=prepare /app/out/json/ . 

# Install with cache mount
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

COPY --from=prepare /app/out/full/ . 

# Generate Prisma and build
RUN cd packages/db && \
    pnpm dlx prisma@6.3.0 generate && \
    rm -rf /root/.cache && \
    cd ../.. && \
    pnpm build && \
    pnpm store prune

FROM base AS runner

WORKDIR /app

# Production environment
ENV NODE_ENV=production
ENV PORT=3001

# Copy package files and install prod deps only
COPY --from=prepare /app/out/json/ .

RUN npm install -g pnpm && \
    pnpm install --prod --frozen-lockfile && \
    cd packages/db && \
    pnpm dlx prisma@6.3.0 generate && \
    npm uninstall -g pnpm && \
    npm cache clean --force && \
    rm -rf /root/.cache /root/.npm /tmp/*

# Copy only necessary files
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Run as non-root user (security best practice)
USER node

CMD ["node", "apps/backend/dist/index.js"]
```

---

## 🔒 Security Bonus

> [!TIP]
> The optimized Dockerfile includes:
> - Running as non-root `USER node`
> - Minimal attack surface (only prod dependencies)
> - Health checks for container orchestration
> - Production environment variables

---

## 📚 Additional Resources

- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Prisma in Docker](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel#docker)
- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Express.js Production Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

---

**Last Updated:** 2026-01-03  
**Dockerfile Location:** `/home/nagmani/root/projects/devforces/docker/backend/Dockerfile`
