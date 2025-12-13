FROM node:alpine

WORKDIR /app

COPY ./package.json .
COPY ./pnpm-lock.yaml .
COPY ./pnpm-workspace.yaml .
COPY ./turbo.json .

COPY ./packages ./packages
COPY ./apps/backend ./apps/backend

RUN npm install -g pnpm

RUN pnpm install 
RUN pnpm build

CMD ["pnpm","start:backend"]
