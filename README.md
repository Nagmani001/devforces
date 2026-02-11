# DevForces

A competitive coding platform where developers build backend systems and battle-test them against hidden test suites — all inside isolated Docker containers.

Built for large-scale online cohorts, DevForces lets admins create contests, and participants submit code that gets executed and evaluated in real-time with live-streamed logs and Codeforces-style leaderboards.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js, React, Tailwind CSS, Jotai |
| Backend | Express, Prisma, PostgreSQL, Redis |
| Worker | Dockerode, Vitest (test runner) |
| Infra | Docker Compose, AWS S3, SSE |
| Monorepo | Turborepo, pnpm workspaces |

## Features

- **Contest System** — Create and manage timed coding contests with multiple challenges
- **Isolated Execution** — Every submission spins up fresh Docker containers, keeping test cases hidden
- **Real-time Logs** — Live-streamed test execution output via Server-Sent Events
- **Codeforces-style Scoring** — Ranking based on tests passed, retry penalties, and submission time
- **Live Leaderboard** — Real-time standings updated as submissions are evaluated
- **Notion Integration** — Problem statements rendered directly from Notion pages
- **Drag & Drop Submissions** — Upload project files from the browser, auto-zipped and sent to S3

## Architecture

```
Browser → Next.js Frontend
              ↓
         Express API → PostgreSQL (data) + Redis (queue & pub/sub)
              ↓
         Worker → Downloads from S3 → Builds & runs in Docker → Streams results back via Redis
```

## Project Structure

```
apps/
  web/        → Next.js frontend
  backend/    → Express API server
  worker/     → Submission processor (Docker-based)
packages/
  db/         → Prisma schema & client
  common/     → Shared types & validation (Zod)
  email/      → Email service (Resend)
  ui/         → Shared UI components
docker/       → Dockerfiles & docker-compose configs
```

## Getting Started

### Prerequisites

- Node.js >= 18
- Docker & Docker Compose
- pnpm 9+

### Setup

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm run db:migrate

# Start all services
docker compose -f docker/docker-compose.yml up
```

The app will be available at `http://localhost:3000` with the API on port `3001`.

### Development (without Docker)

```bash
pnpm run start:webdev     # Frontend on :3000
pnpm run start:backend    # API on :3001
cd apps/worker && pnpm dev # Worker
```

> Make sure PostgreSQL and Redis are running locally or update `.env` accordingly.

## How It Works

1. Admin creates a contest with challenges (Notion doc + Vitest test file + GitHub template)
2. Participant opens the Arena, reads the problem, and builds their solution locally
3. Participant drags & drops their project files into the browser
4. Files are zipped, uploaded to S3, and queued for processing via Redis
5. Worker pulls the submission, builds it in Docker, runs the test suite
6. Logs stream back in real-time; results update the leaderboard instantly

## License

MIT
