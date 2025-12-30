# TODO
#
# summary from: https://turborepo.com/docs/guides/tools/docker 
# The problem : your docker file is very wrong 
# 1. any code change will trigger npm install 
# 2. even you you did something like , copy root package.json , root package-lock.json,  copy apps/backend/package.json 
# you still end up rerunning npm install if a dependency in apps/web has changed 
# solution , turbo prune backend --docker , turbo prune created a ./out , with --docker flag it  creates ./out with two divisions
# solve by using this ./out to write dockerfile , moreover see their --with-docker example to use it to full potential


FROM node:alpine

WORKDIR /app

COPY ./package.json .
COPY ./pnpm-lock.yaml .
COPY ./pnpm-workspace.yaml .
COPY ./turbo.json .

COPY ./packages ./packages
COPY ./apps/worker ./apps/worker

RUN npm install -g pnpm

RUN pnpm install 
RUN pnpm build

CMD ["pnpm","start:worker"]
