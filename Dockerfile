FROM node:22-alpine

WORKDIR /app

# Native tooling for sharp / prisma / ffmpeg-static postinstall scripts on Alpine
RUN apk add --no-cache libc6-compat openssl python3 make g++

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

EXPOSE 4000

CMD ["pnpm", "start"]
