# ==========================================

# PRODUCTION QUICK START GUIDE

# ==========================================

## 🚀 Como rodar em produção

### 1. Configurar variáveis de ambiente

```bash
# Copie o exemplo
cp .env.prod.example .env.prod

# Edite com suas configurações
# IMPORTANTE: Configure VITE_API_URL e VITE_WS_URL com seu IP/domínio
```

### 2. URLs para diferentes cenários

#### Localhost (teste local)

```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3004
CORS_ORIGIN=http://localhost:5173
```

#### Rede local / Radmin VPN

```env
VITE_API_URL=http://SEU_IP:3001
VITE_WS_URL=http://SEU_IP:3004
CORS_ORIGIN=http://SEU_IP:5173
```

### 3. Build e iniciar

```bash
# Build com Turbo Prune (otimizado)
docker compose -f docker-compose.prod.yml up --build -d

# Ver logs
docker compose -f docker-compose.prod.yml logs -f

# Parar
docker compose -f docker-compose.prod.yml down
```

### 4. Acessar aplicação

- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:3001
- **RabbitMQ Management**: http://localhost:15672

### 5. Debugging

```bash
# Ver status dos containers
docker compose -f docker-compose.prod.yml ps

# Ver logs de um serviço específico
docker compose -f docker-compose.prod.yml logs -f web
docker compose -f docker-compose.prod.yml logs -f api-gateway

# Rebuild apenas um serviço
docker compose -f docker-compose.prod.yml up --build -d web
```

## ⚡ Diferenças: Dev vs Prod

| Aspecto     | Dev (docker-compose.yml) | Prod (docker-compose.prod.yml) |
| ----------- | ------------------------ | ------------------------------ |
| Dockerfiles | `Dockerfile`             | `Dockerfile.prod`              |
| Build       | Sem Turbo Prune          | Com Turbo Prune ✅             |
| Hot Reload  | Sim (volumes)            | Não (imagens otimizadas)       |
| Tamanho     | Maior                    | Menor                          |
| Performance | Desenvolvimento          | Otimizada                      |

## 🔒 Segurança

Antes de deploy em produção real:

1. ✅ Altere **todos** os secrets no `.env.prod`
2. ✅ Use senhas fortes (geradas aleatoriamente)
3. ✅ Configure HTTPS (reverse proxy com nginx/traefik)
4. ✅ Considere usar Docker Secrets ou vault
5. ✅ Adicione `.env.prod` ao `.gitignore`
