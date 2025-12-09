# 🚀 Sistema de Gestão de Tarefas Colaborativo

> Desafio Full-stack Júnior - Jungle Gaming

Sistema completo de gerenciamento de tarefas com suporte a múltiplos usuários, notificações em tempo real, comentários e histórico de alterações, construído com arquitetura de microserviços.

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)]()
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)]()
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)]()
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)]()
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)]()

---

## 📋 Índice

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Arquitetura](#-arquitetura)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Decisões Técnicas](#-decisões-técnicas)
- [Endpoints da API](#-endpoints-da-api)
- [Testes](#-testes)
- [Problemas Conhecidos](#-problemas-conhecidos)
- [Melhorias Futuras](#-melhorias-futuras)
- [Tempo de Desenvolvimento](#-tempo-de-desenvolvimento)

---

## ✨ Features

### Autenticação & Segurança

- ✅ Registro e login de usuários
- ✅ JWT com `accessToken` (15 min) e `refreshToken` (7 dias)
- ✅ Hash de senhas com bcrypt
- ✅ Recuperação de senha via email (BÔNUS)
- ✅ Rate limiting (10 req/seg global, limites específicos por endpoint)
- ✅ Helmet para security headers

### Gestão de Tarefas

- ✅ CRUD completo de tarefas
- ✅ 4 status: TODO, IN_PROGRESS, REVIEW, DONE
- ✅ 4 prioridades: LOW, MEDIUM, HIGH, URGENT
- ✅ Atribuição múltipla de usuários
- ✅ Filtros e busca avançada
- ✅ Paginação com metadados completos
- ✅ Sistema de comentários
- ✅ Histórico completo de alterações (audit log)

### Notificações & Tempo Real

- ✅ WebSocket para notificações em tempo real
- ✅ Notificações quando:
  - Tarefa é atribuída ao usuário
  - Status da tarefa muda
  - Novo comentário em tarefa que participa
- ✅ Persistência de notificações
- ✅ Marcar como lida

### Microserviços & Mensageria

- ✅ Arquitetura de microserviços com NestJS
- ✅ Comunicação via RabbitMQ
- ✅ API Gateway como ponto único de entrada
- ✅ Email service para recuperação de senha

---

## 🚀 Quick Start

### Pré-requisitos

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/) v9+
- [Docker](https://www.docker.com/) & Docker Compose

### Instalação

```bash
# 1. Clone o repositório
git clone <repository-url>
cd Desafio-Full-stack

# 2. Instale as dependências
pnpm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env conforme necessário

# 4. Inicie os serviços com Docker Compose
docker-compose up -d

# 5. Aguarde os serviços iniciarem (~30 segundos)
# Verifique com: docker-compose ps
```

### Acessar a Aplicação

- **Frontend:** http://localhost:5173
- **API Gateway:** http://localhost:3001
- **Swagger Docs:** http://localhost:3001/api/docs
- **RabbitMQ Management:** http://localhost:15672 (admin/admin)

### Primeiros Passos

1. Acesse http://localhost:5173
2. Clique em "Criar conta" e registre-se
3. Faça login com suas credenciais
4. Comece a criar tarefas! 🎉

---

## 🏗️ Arquitetura

### Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│                    http://localhost:5173                        │
│        TanStack Router • shadcn/ui • Tailwind CSS               │
└────────────┬────────────────────────────────┬───────────────────┘
             │ HTTP (REST)                    │ WebSocket (WS)
             │                                │
┌────────────▼────────────────────────────────▼───────────────────┐
│                    API GATEWAY (NestJS)                         │
│                   http://localhost:3001                         │
│         JWT Guards • Rate Limiting • Swagger                    │
└──┬────────┬────────┬────────┬───────────────────────────────────┘
   │        │        │        │
   │ RPC    │ RPC    │ RPC    │ RPC
   │        │        │        │
┌──▼───┐ ┌─▼────┐ ┌─▼─────┐ ┌▼────────────┐ ┌────────────────┐
│ Auth │ │Tasks │ │ Notif │ │    Email    │ │   PostgreSQL   │
│ Svc  │ │ Svc  │ │  Svc  │ │    Svc      │ │   (Port 5432)  │
│ 3002 │ │ 3003 │ │ 3004  │ │    3007     │ │                │
└──┬───┘ └──┬───┘ └───┬───┘ └─────────────┘ └────────────────┘
   │        │         │           │
   └────────┴─────────┴───────────┴─────────────────────┐
                                                         │
                    ┌────────────────────────────────────▼───┐
                    │       RabbitMQ Message Broker          │
                    │         (Port 5672, 15672)             │
                    └────────────────────────────────────────┘
```

### Fluxo de Dados

#### CRUD de Tarefas

```
User → Frontend → API Gateway → Tasks Service → PostgreSQL
                                      ↓
                                  RabbitMQ (event: task_created)
                                      ↓
                              Notifications Service
                                      ↓
                            WebSocket → Frontend (real-time)
```

#### Autenticação

```
User → Frontend → API Gateway → Auth Service → PostgreSQL
                                      ↓
                           JWT Tokens (access + refresh)
                                      ↓
                              Frontend (localStorage)
```

#### Recuperação de Senha

```
User → Frontend → API Gateway → Auth Service → PostgreSQL (save token)
                                      ↓
                                  RabbitMQ (password_reset_requested)
                                      ↓
                                 Email Service
                                      ↓
                              SMTP → Gmail → User
```

---

## 🛠️ Stack Tecnológico

### Frontend

- **React.js** 19.2 - Framework UI
- **TanStack Router** 1.139 - Roteamento type-safe
- **TanStack Query** 5.90 - State management server
- **shadcn/ui** - Componentes UI (10+ componentes)
- **Tailwind CSS** 3.4 - Styling
- **Framer Motion** 12.23 - Animações
- **Zod** 4.1 - Validação de schemas
- **React Hook Form** 7.67 - Gerenciamento de formulários
- **Socket.IO Client** 4.8 - WebSocket client

### Backend

- **NestJS** 10 - Framework backend
- **TypeORM** 0.3 - ORM para PostgreSQL
- **Passport JWT** - Autenticação
- **RabbitMQ** 3.13 - Message broker
- **Class Validator** - Validação de DTOs
- **Bcrypt** - Hash de senhas
- **Swagger/OpenAPI** - Documentação da API
- **Helmet** - Security headers
- **Throttler** - Rate limiting

### Infraestrutura

- **PostgreSQL** 17.5 Alpine - Banco de dados
- **Docker** & **Docker Compose** - Containerização
- **pnpm** - Package manager
- **Turborepo** - Monorepo build system

### DevOps & Qualidade

- **ESLint** - Linter
- **Prettier** - Code formatter
- **Jest** - Framework de testes
- **TypeScript** 5.9 - Type safety

---

## 📁 Estrutura do Projeto

```
Desafio-Full-stack/
├── apps/
│   ├── web/                      # Frontend React
│   │   ├── src/
│   │   │   ├── routes/           # TanStack Router routes
│   │   │   ├── components/       # Componentes reutilizáveis
│   │   │   ├── composables/      # Hooks customizados
│   │   │   └── context/          # React Context (Auth, Socket)
│   │   └── Dockerfile
│   │
│   ├── api-gateway/              # Gateway HTTP + WebSocket
│   │   ├── src/
│   │   │   ├── auth/             # Proxy para auth-service
│   │   │   ├── tasks/            # Proxy para tasks-service
│   │   │   ├── users/            # Enriquecimento de usuários
│   │   │   └── notifications/    # Proxy para notif-service
│   │   └── Dockerfile
│   │
│   ├── auth-service/             # Microserviço de autenticação
│   │   ├── src/
│   │   │   ├── auth/             # Login, refresh, logout
│   │   │   └── users/            # CRUD de usuários
│   │   └── Dockerfile
│   │
│   ├── tasks-service/            # Microserviço de tarefas
│   │   ├── src/
│   │   │   └── tasks/
│   │   │       ├── entities/     # Task, TaskHistory, TaskComment, TaskAssignee
│   │   │       └── tasks.service.ts
│   │   └── Dockerfile
│   │
│   ├── notifications-service/    # Microserviço de notificações
│   │   ├── src/
│   │   │   ├── notifications.service.ts
│   │   │   └── notifications.gateway.ts  # WebSocket Gateway
│   │   └── Dockerfile
│   │
│   └── email-service/            # Microserviço de email (BÔNUS)
│       ├── src/
│       │   └── email.controller.ts
│       └── Dockerfile
│
├── packages/
│   ├── dtos/                     # DTOs compartilhados
│   ├── types/                    # Types compartilhados
│   ├── utils/                    # Utilitários
│   ├── eslint-config/            # Config ESLint
│   └── tsconfig/                 # Config TypeScript
│
├── docker-compose.yml            # Orquestração de containers
├── turbo.json                    # Config Turborepo
├── pnpm-workspace.yaml           # Config pnpm workspaces
└── .env.example                  # Exemplo de variáveis
```

---

## 🧠 Decisões Técnicas

### Por que Microserviços?

**Vantagens:**

- ✅ **Separação de responsabilidades** - Cada serviço tem uma função clara
- ✅ **Escalabilidade independente** - Tasks pode escalar sem afetar Auth
- ✅ **Desenvolvimento paralelo** - Times podem trabalhar independentemente
- ✅ **Resiliência** - Falha em um serviço não derruba o sistema completo

**Trade-offs:**

- ⚠️ **Complexidade** - Mais difícil de debugar
- ⚠️ **Overhead** - Comunicação entre serviços adiciona latência
- ⚠️ **DevOps** - Requer Docker e orquestração

**Decisão:** Para um sistema de tarefas colaborativo, os benefícios superam os custos, especialmente considerando a necessidade de notificações em tempo real e processos assíncronos.

### Por que RabbitMQ ao invés de Redis/Kafka?

**Razões:**

- ✅ **Simplicidade** - Mais fácil de configurar que Kafka
- ✅ **Confiabilidade** - Garantias de entrega (acknowledge)
- ✅ **Flexibilidade** - Suporta múltiplos padrões (pub/sub, RPC, work queues)
- ✅ **Management UI** - Interface web para monitoramento

**Alternativas consideradas:**

- Redis Pub/Sub: Sem persistência, sem garantia de entrega
- Kafka: Overkill para este caso de uso, complexidade desnecessária

### Por que TanStack Router ao invés de React Router?

**Vantagens:**

- ✅ **Type-safety** - Rotas completamente tipadas
- ✅ **File-based routing** - Estrutura mais organizada
- ✅ **Built-in code splitting** - Melhor performance
- ✅ **Search params validation** - Validação automática de query params

### Estratégia de Autenticação

**JWT com Dual Tokens:**

- `accessToken` (15 min): Usado em todas as requisições
- `refreshToken` (7 dias): Renova o accessToken sem relogin

**Por quê:**

- ✅ Segurança: Tokens de curta duração reduzem janela de ataque
- ✅ UX: Usuário não precisa fazer login frequentemente
- ✅ Stateless: Não requer sessões no servidor

**Armazenamento:** localStorage (frontend) + hash bcrypt (backend)

### Paginação & Filtros

**Implementação:**

- Paginação com `page` e `limit` (max 100 itens)
- Metadados: `total`, `totalPages`, `page`, `limit`
- Filtros: título, status, prioridade, assignee, dueDate

**Por quê:**

- ✅ Performance: Evita carregar milhares de registros
- ✅ UX: Permite navegação eficiente
- ✅ Backend: Reduz carga do banco de dados

### TypeORM em Sync Mode

**⚠️ IMPORTANTE:** Por simplicidade no desenvolvimento, o TypeORM está configurado em `synchronize: true`.

**Implicações:**

- ✅ Desenvolvimento rápido: Schema atualizado automaticamente
- ❌ Produção: **NUNCA** usar sync mode em produção
- ❌ Migrations: Não foram geradas (problema conhecido)

**Solução para produção:**

```bash
# Desativar sync e gerar migrations
typeorm migration:generate -n InitialSchema
typeorm migration:run
```

---

## 📡 Endpoints da API

### Base URL

```
http://localhost:3001/api
```

### Documentação Interativa

```
http://localhost:3001/api/docs
```

### Autenticação

| Método | Endpoint                | Descrição        | Auth |
| ------ | ----------------------- | ---------------- | ---- |
| POST   | `/auth/register`        | Criar nova conta | ❌   |
| POST   | `/auth/login`           | Fazer login      | ❌   |
| POST   | `/auth/refresh`         | Renovar token    | ❌   |
| POST   | `/auth/logout`          | Fazer logout     | ✅   |
| POST   | `/auth/forgot-password` | Solicitar reset  | ❌   |
| POST   | `/auth/reset-password`  | Redefinir senha  | ❌   |

### Tarefas

| Método | Endpoint                 | Descrição            | Auth |
| ------ | ------------------------ | -------------------- | ---- |
| GET    | `/tasks?page=1&limit=10` | Listar tarefas       | ✅   |
| POST   | `/tasks`                 | Criar tarefa         | ✅   |
| GET    | `/tasks/:id`             | Buscar tarefa        | ✅   |
| PATCH  | `/tasks/:id`             | Atualizar tarefa     | ✅   |
| DELETE | `/tasks/:id`             | Deletar tarefa       | ✅   |
| GET    | `/tasks/:id/history`     | Histórico            | ✅   |
| POST   | `/tasks/:id/comments`    | Adicionar comentário | ✅   |
| GET    | `/tasks/:id/comments`    | Listar comentários   | ✅   |

### Notificações

| Método | Endpoint                  | Descrição           | Auth |
| ------ | ------------------------- | ------------------- | ---- |
| GET    | `/notifications`          | Listar notificações | ✅   |
| PATCH  | `/notifications/:id/read` | Marcar como lida    | ✅   |

### WebSocket Events

**Conexão:** `ws://localhost:3004`

**Eventos recebidos:**

- `task:created` - Nova tarefa criada
- `task:updated` - Tarefa atualizada
- `comment:new` - Novo comentário

**Autenticação WebSocket:**

```javascript
io("ws://localhost:3004", {
  auth: { token: "your-jwt-token" },
});
```

---

## 🧪 Testes

### Executar Testes

```bash
# Testes do Auth Service
cd apps/auth-service
pnpm test

# Testes do Tasks Service
cd apps/tasks-service
pnpm test

# Todos os testes com coverage
pnpm --filter "*-service" test:cov
```

### Coverage Atual

| Serviço           | Statements | Branches | Functions | Lines |
| ----------------- | ---------- | -------- | --------- | ----- |
| **auth-service**  | ~80%       | ~75%     | ~85%      | ~80%  |
| **tasks-service** | ~75%       | ~70%     | ~80%      | ~75%  |

### Testes Implementados

**Auth Service (11 testes):**

- ✅ Login com credenciais válidas/inválidas
- ✅ Geração de tokens (access + refresh)
- ✅ Refresh token válido/inválido
- ✅ Logout
- ✅ Forgot/Reset password

**Tasks Service (15 testes):**

- ✅ CRUD completo de tarefas
- ✅ Autorização (owner vs assignee)
- ✅ Paginação e filtros
- ✅ Comentários e histórico
- ✅ Notificações assíncronas

**JWT Strategy (3 testes):**

- ✅ Validação de payload
- ✅ Extração de claims

---

## 🐛 Problemas Conhecidos

### 1. TypeORM Migrations

**Status:** ⚠️ Não implementado

**Problema:** Database schema é sincronizado automaticamente (`synchronize: true`)

**Impacto:** Em produção, isso pode causar perda de dados

**Solução:**

```typescript
// Desabilitar sync em produção
synchronize: process.env.NODE_ENV !== 'production'

// Gerar migrations
npm run typeorm migration:generate -- -n InitialSchema
```

### 2. Logging Estruturado

**Status:** ⚠️ Básico (console.log)

**Problema:** Logs não são estruturados nem persistidos

**Solução futura:** Implementar Winston ou Pino com níveis de log

### 3. Testes E2E

**Status:** ❌ Não implementado

**Problema:** Apenas testes unitários foram criados

**Solução futura:** Adicionar testes E2E com Supertest para controllers

### 4. Frontend Error Boundary

**Status:** ⚠️ Básico

**Problema:** Erros não tratados podem quebrar a UI

**Solução futura:** Implementar Error Boundary do React

---

## 🚀 Melhorias Futuras

### Curto Prazo (1-2 semanas)

- [ ] Implementar migrations TypeORM
- [ ] Adicionar logging estruturado (Winston)
- [ ] Testes E2E dos controllers
- [ ] Skeleton loaders no frontend
- [ ] Upload de anexos em tarefas

### Médio Prazo (1-2 meses)

- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Monitoramento (Prometheus + Grafana)
- [ ] Backup automático do banco
- [ ] Suporte a tags/labels
- [ ] Dashboard de métricas

### Longo Prazo (3+ meses)

- [ ] Kubernetes deployment
- [ ] Multi-tenancy (organizações)
- [ ] Relatórios e analytics
- [ ] Mobile app (React Native)
- [ ] Integração com Slack/Discord

---

## ⏱️ Tempo de Desenvolvimento

| Fase                        | Tempo   | Descrição                                        |
| --------------------------- | ------- | ------------------------------------------------ |
| **Planejamento & Setup**    | 4h      | Arquitetura, escolha de stack, setup do monorepo |
| **Backend - Auth Service**  | 6h      | JWT, bcrypt, refresh tokens, password reset      |
| **Backend - Tasks Service** | 8h      | CRUD, filtros, paginação, histórico, comentários |
| **Backend - Notifications** | 5h      | RabbitMQ integration, WebSocket, persistência    |
| **Backend - Email Service** | 3h      | SMTP, templates, RabbitMQ consumer               |
| **Frontend - Estrutura**    | 4h      | TanStack Router, shadcn/ui, context, hooks       |
| **Frontend - Auth**         | 4h      | Login, register, forgot password, guards         |
| **Frontend - Tasks**        | 8h      | Dashboard, filtros, dialog, comments, notif      |
| **Docker & DevOps**         | 3h      | Dockerfiles, compose, healthchecks               |
| **Testes**                  | 4h      | Jest setup, unit tests (29 testes)               |
| **Documentação**            | 2h      | README, comments, swagger                        |
| **TOTAL**                   | **51h** | ~6.5 dias de trabalho                            |

---

## 🤝 Contribuindo

Este é um projeto de desafio, mas sugestões são bem-vindas!

```bash
# Fork o projeto
# Crie uma branch
git checkout -b feature/amazing-feature

# Commit suas mudanças
git commit -m 'Add amazing feature'

# Push para a branch
git push origin feature/amazing-feature

# Abra um Pull Request
```

---

## 📄 Licença

Este projeto foi desenvolvido como parte de um desafio técnico.

---

## 👨‍💻 Autor

**João Pedro** - Desenvolvedor Full-stack

- GitHub: [@Joao-19](https://github.com/Joao-19)
- LinkedIn: [João Pedro](https://linkedin.com/in/seu-perfil)

---

## 🙏 Agradecimentos

- [Jungle Gaming](https://junglegaming.com) - Pela oportunidade do desafio ❤️
- [NestJS](https://nestjs.com) - Framework backend incrível ⭐⭐⭐
- [TanStack](https://tanstack.com) - Router e Query excepcionais ⭐⭐⭐
- [shadcn/ui](https://ui.shadcn.com) - Componentes UI de alta qualidade ⭐⭐⭐

---

<div align="center">
  
**Desenvolvido com ❤️ e ☕ por João**

⭐ Se este projeto te ajudou, considere dar uma estrela!

</div>
