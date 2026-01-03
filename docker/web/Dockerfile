ARG NODE_VERSION=24.11.0
FROM node:${NODE_VERSION}-alpine AS base

FROM base AS prepare 

WORKDIR /app
RUN npm install -g turbo
COPY . . 

RUN turbo prune web --docker


FROM base AS builder 

WORKDIR /app 

RUN npm install -g pnpm 
COPY --from=prepare ./app/out/json/ . 
RUN pnpm install  

COPY --from=prepare ./app/out/full/ . 

RUN pnpm build


FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
COPY --from=builder /app . 

CMD [ "npm","run","start:webdev" ]
