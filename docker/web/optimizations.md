# Docker Image Optimization Guide

> **Current Image Size:** 1.4 GB  
> **Target Size:** 200-400 MB  
> **Potential Savings:** ~1 GB (71% reduction)

---

## 🎯 Major Optimizations (Biggest Impact)

### 1. Don't Copy the Entire Build Output to Runner

**Current Issue:**  
Line 30 in the Dockerfile copies everything from the builder stage (`COPY --from=builder /app .`), including:
- All `node_modules` (both dev and prod dependencies)
- Source files
- Build artifacts
- pnpm cache

**Optimization:**  
Only copy what's needed to run the app:
- The `.next` directory (built output)
- `public` directory (if any static assets)
- `package.json` and lock file
- Production `node_modules` only

**Expected Savings:** 500-800 MB

---

### 2. Install Only Production Dependencies in Runner

**Current Issue:**  
The runner stage doesn't install its own dependencies - it copies everything from builder.

**Optimization:**  
In the runner stage:
1. Copy only `package.json` and lock files
2. Run `pnpm install --prod --frozen-lockfile` to install only production dependencies
3. Then copy the built `.next` output

**Expected Savings:** 200-400 MB (dev dependencies are heavy)

---

### 3. Use Standalone Output Mode

> [!IMPORTANT]
> This is the **single most effective optimization** for Next.js applications!

**Configuration:**  
Enable Next.js standalone output in `next.config.js`:

```javascript
module.exports = {
  output: 'standalone'
}
```

This creates a minimal server in `.next/standalone` with only necessary files.

**Implementation:**  
Copy only these directories to the runner stage:
- `.next/standalone/*` → `/app`
- `.next/static` → `/app/.next/static`
- `public` → `/app/public`

**Expected Savings:** 400-700 MB

---

## 📦 Medium Impact Optimizations

### 4. Use Multi-Stage Build Cleanup

Add cleanup commands after installations to remove package manager caches.

**Implementation:**
```dockerfile
RUN pnpm install && pnpm store prune
```

**Expected Savings:** 50-150 MB

---

### 5. Minimize Layer Size with `.dockerignore`

Ensure you have a comprehensive `.dockerignore` file to exclude unnecessary files from the build context.

**Recommended `.dockerignore` contents:**
```
node_modules
.next
.git
**/*.log
**/.DS_Store
**/dist
**/build
**/.turbo
.env*
```

**Expected Savings:** 100-300 MB (depends on what's currently included)

---

### 6. Use `--mount=type=cache` for pnpm

Use BuildKit cache mounts to avoid including pnpm cache in the final image.

**Implementation:**
```dockerfile
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
```

> [!NOTE]
> This requires Docker BuildKit to be enabled (`DOCKER_BUILDKIT=1`)

**Expected Savings:** 50-100 MB

---

## 🔧 Smaller Optimizations

### 7. Remove Unnecessary Global Packages in Runner

**Issue:**  
The runner stage reinstalls Node.js alpine but doesn't need `turbo` or `pnpm` at runtime.

**Optimization:**  
Don't install global packages in the runner stage - they're only needed during build.

**Expected Savings:** 20-50 MB

---

### 8. Combine RUN Commands

**Issue:**  
Multiple `RUN` commands create multiple layers, which can be inefficient.

**Optimization:**  
Reduce layer count by combining related commands:

```dockerfile
RUN npm install -g turbo && turbo prune web --docker
```

**Expected Savings:** Minimal direct savings, but improves build cache efficiency

---

### 9. Clean Package Manager Cache

Add cleanup after installs to remove package manager caches from the image.

**Implementation:**
```dockerfile
RUN pnpm install && rm -rf ~/.pnpm-store
```

**Expected Savings:** 30-80 MB

---

### 10. Consider Distroless or Scratch Base for Runner

Instead of `node:alpine` for the runner stage, use a more minimal base image.

**Option 1 - Distroless (Recommended):**
```dockerfile
FROM gcr.io/distroless/nodejs20-debian12
```

**Benefits:**
- Smaller image size
- Better security (minimal attack surface)
- No shell or package managers

**Expected Savings:** 30-50 MB

> [!CAUTION]
> Distroless images are more complex to debug since they lack shell access

---

## 📊 Expected Results

### Optimization Priority

| Priority | Optimizations | Expected Size | Savings |
|----------|---------------|---------------|---------|
| **HIGH** | #1, #2, #3 | 200-400 MB | ~1 GB |
| **MEDIUM** | + #4, #5, #6 | 150-300 MB | ~1.1 GB |
| **ALL** | All 10 optimizations | 100-250 MB | ~1.2 GB |

### Recommended Implementation Order

1. **Phase 1 (Quick Wins):** Implement optimizations #5 (`.dockerignore`) first
2. **Phase 2 (Major Impact):** Add #3 (standalone mode), #1 (selective copy), #2 (prod deps)
3. **Phase 3 (Polish):** Add remaining optimizations #4, #6, #7, #8, #9
4. **Phase 4 (Advanced):** Consider #10 (distroless) for production deployments

---

## 🎯 Key Takeaway

> [!IMPORTANT]
> The **single most effective change** is combining:
> - Next.js standalone mode (#3)
> - Copying only necessary files (#1)
> - Production-only dependencies (#2)
>
> This combination alone can reduce your image from **1.4 GB to 200-400 MB** (~71% reduction)

---

## 📚 Additional Resources

- [Next.js Standalone Output Documentation](https://nextjs.org/docs/app/api-reference/next-config-js/output)
- [Docker Multi-Stage Builds Best Practices](https://docs.docker.com/build/building/multi-stage/)
- [Docker BuildKit Cache Mounts](https://docs.docker.com/build/cache/)
- [Google Distroless Images](https://github.com/GoogleContainerTools/distroless)

---

**Last Updated:** 2026-01-03  
**Dockerfile Location:** `/home/nagmani/root/projects/devforces/docker/web/Dockerfile`
