FROM node:alpine

WORKDIR /app

COPY ./package.json .
COPY ./pnpm-lock.yaml .
COPY ./pnpm-workspace.yaml .
COPY ./turbo.json .

COPY ./packages ./packages
COPY ./apps/web ./apps/web

# COPY ./index.js .
RUN npm install -g pnpm

RUN pnpm install 
RUN pnpm build

CMD ["pnpm","start:web"]
