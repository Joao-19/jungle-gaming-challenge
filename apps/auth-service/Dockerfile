FROM node:20-alpine
RUN npm install -g pnpm
WORKDIR /app

# Copia tudo (o .dockerignore filtra o lixo)
COPY . .

# Instala dependências do monorepo
RUN pnpm install

# Roda o comando específico deste serviço
CMD ["pnpm", "--filter", "auth-service", "start:dev"]