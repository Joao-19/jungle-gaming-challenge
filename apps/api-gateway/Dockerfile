FROM node:20-alpine
RUN npm install -g pnpm
WORKDIR /app
COPY . .
RUN pnpm install
CMD ["pnpm", "--filter", "api-gateway", "start:dev"]