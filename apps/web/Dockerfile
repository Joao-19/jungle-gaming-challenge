FROM node:20-alpine
RUN npm install -g pnpm
WORKDIR /app
COPY . .
RUN pnpm install
# --host é obrigatório para acessar o Vite de fora do container
CMD ["pnpm", "--filter", "web", "dev", "--host"]