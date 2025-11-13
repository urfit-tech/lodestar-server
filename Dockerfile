FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

FROM node:18-alpine AS production

WORKDIR /usr/src/app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

COPY --chown=nestjs:nodejs package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && \
    yarn cache clean

COPY --from=builder --chown=nestjs:nodejs /usr/src/app/dist ./dist

USER nestjs

EXPOSE 8081

CMD ["node", "dist/src/main"]