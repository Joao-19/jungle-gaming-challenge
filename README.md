# 🚀 Sistema de Gestão de Tarefas Colaborativo

| Sistema completo de gerenciamento de tarefas com suporte a múltiplos usuários, notificações em tempo real, comentários e histórico de alterações, construído com arquitetura de microserviços.

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
- **TypeORM Migrations** - Gerenciamento de schema do banco
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

### Padrões de Comunicação: RPC Síncrono vs Mensageria Assíncrona

**Decisão Arquitetural:** O API Gateway utiliza **duas estratégias distintas** para comunicação com os microserviços, baseadas no tipo de operação.

**1. RPC Síncrono (TCP) - Operações CRUD:**

```
API Gateway → [TCP/RPC] → Auth/Tasks Services → PostgreSQL → Response
```

**Quando usado:**

- Operações CRUD (Create, Read, Update, Delete)
- Autenticação e validação de tokens
- Consultas que exigem resposta imediata
- Qualquer operação crítica do fluxo principal do usuário

**Razões técnicas:**

- ✅ **Baixa latência** - Comunicação direta TCP (~5-10ms) vs RabbitMQ (~50-100ms)
- ✅ **Feedback imediato** - Usuário recebe resposta síncrona de sucesso/erro
- ✅ **Disponibilidade de dados críticos** - Se RabbitMQ cair, operações essenciais continuam funcionando
- ✅ **Transações** - Permite rollback e controle transacional adequado
- ✅ **Simplicidade** - Request/Response é mais simples para operações CRUD

**2. Mensageria Assíncrona (RabbitMQ) - Eventos e Notificações:**

```
Tasks Service → [RabbitMQ Event] → Notifications/Email Services
```

**Quando usado:**

- Envio de notificações em tempo real
- Disparo de emails (recuperação de senha, confirmação)
- Broadcast de eventos (task_created, task_updated, comment_added)
- Operações que **não bloqueiam** o fluxo principal

**Razões técnicas:**

- ✅ **Desacoplamento** - Serviços não precisam conhecer uns aos outros
- ✅ **Resiliência** - Mensagens persistidas em caso de falha temporária
- ✅ **Escalabilidade** - Múltiplos consumidores podem processar eventos
- ✅ **Fire-and-forget** - Operação principal não aguarda conclusão
- ✅ **Event sourcing** - Histórico de eventos do sistema

**Trade-offs da Abordagem Híbrida:**

| Aspecto          | RPC Síncrono        | RabbitMQ Assíncrono   |
| ---------------- | ------------------- | --------------------- |
| **Latência**     | 5-10ms              | 50-100ms              |
| **Garantias**    | Resposta imediata   | Eventual consistency  |
| **Resiliência**  | Falha = erro direto | Retry automático      |
| **Complexidade** | Baixa               | Média                 |
| **Uso ideal**    | Dados críticos      | Notificações, eventos |

**Por que não usar RabbitMQ para tudo?**

- ❌ **Latência inaceitável** - Usuário aguardando 100ms+ para cada requisição CRUD
- ❌ **Single point of failure** - Se RabbitMQ cair, sistema inteiro para
- ❌ **Perda de dados críticos** - Sem resposta síncrona, impossível validar se operação teve sucesso
- ❌ **UX degradada** - Impossível mostrar erro de validação imediatamente (ex: "Email já cadastrado")
- ❌ **Overhead desnecessário** - Serialização/deserialização adicional para operações simples

**Por que não usar apenas RPC?**

- ❌ **Acoplamento** - Serviços precisariam conhecer todos os consumidores
- ❌ **Bloqueio** - Envio de email atrasaria resposta do cadastro
- ❌ **Escalabilidade** - Dificultar adicionar novos consumidores de eventos

**Decisão final:** Arquitetura híbrida que combina o melhor dos dois mundos - **RPC para operações síncronas críticas** e **RabbitMQ para eventos assíncronos**, maximizando performance, disponibilidade e experiência do usuário.

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

### Segurança em Camadas: Isolamento de Rede + JWT Guards

**Decisão Arquitetural:** Implementação de **Defense in Depth** (segurança em profundidade) para comunicação entre microserviços.

**Camada 1: Isolamento de Rede Docker**

```yaml
# docker-compose.yml
services:
  api-gateway:
    networks:
      - frontend
      - backend

  auth-service:
    networks:
      - backend # NÃO exposto externamente
    ports: [] # Sem bind de portas públicas
```

**Benefícios:**

- ✅ **Performance** - Comunicação via rede interna Docker (~0.1ms overhead)
- ✅ **Isolamento** - Microserviços **não acessíveis** diretamente da internet
- ✅ **DNS interno** - Resolução de nomes automática (ex: `auth-service:3002`)
- ✅ **Zero configuração** - Docker gerencia roteamento automaticamente
- ✅ **Segurança por padrão** - Apenas API Gateway exposto externamente

**Topologia de Rede:**

```
Internet → API Gateway (porta 3001 pública)
              ↓
         [Docker Network: backend]
              ↓
    ┌─────────┼─────────┬──────────┐
    ↓         ↓         ↓          ↓
  Auth    Tasks    Notif       Email
  :3002   :3003    :3004       :3007
  (privado)(privado)(privado) (privado)
```

**Camada 2: JWT Guards nos Microserviços (Defense in Depth)**

**⚠️ Decisão Crítica:** Mesmo com isolamento de rede, **todos os endpoints internos possuem validação JWT**.

**Por quê?**

```typescript
// auth-service/src/users/users.controller.ts
@Controller("users")
@UseGuards(JwtAuthGuard) // ← Proteção JWT mesmo sendo interno
export class UsersController {
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(+id);
  }
}
```

**Razões técnicas:**

- ✅ **Defesa contra vazamento de rotas** - Se endpoint interno vazar (ex: erro de config NGinx/proxy), ainda está protegido
- ✅ **Segurança contra container escape** - Se atacante comprometer um container, não consegue acessar outros serviços
- ✅ **Auditoria e logs** - JWT fornece contexto do usuário para rastreamento
- ✅ **Autorização granular** - Permite verificar permissões por usuário mesmo internamente
- ✅ **Preparação para produção** - Se migrar para Kubernetes/service mesh, já está seguro

**Cenários de Ataque Mitigados:**

| Cenário                                    | Sem JWT Interno                         | Com JWT Interno                         |
| ------------------------------------------ | --------------------------------------- | --------------------------------------- |
| **Rota vazada (proxy misconfiguration)**   | ❌ Acesso direto ao microserviço        | ✅ Bloqueado - requer JWT válido        |
| **Container comprometido**                 | ❌ Atacante pode chamar outros serviços | ✅ Limitado - precisa roubar JWT válido |
| **SSRF (Server-Side Request Forgery)**     | ❌ Pode acessar serviços internos       | ✅ Bloqueado - sem token válido         |
| **Insider threat (funcionário malicioso)** | ❌ Acesso direto via VPN/network        | ✅ Logs de auditoria + autorização      |

**Trade-offs da Abordagem:**

**Prós:**

- ✅ **Zero trust architecture** - "Nunca confie, sempre verifique"
- ✅ **Compliance** - Atende requisitos de segurança (PCI-DSS, SOC2)
- ✅ **Rastreabilidade** - Logs sempre contêm `userId` do JWT
- ✅ **Flexibilidade** - Fácil migrar para cloud (AWS ECS, GCP Cloud Run)

**Contras:**

- ⚠️ **Overhead mínimo** - Validação JWT adiciona ~1-2ms por requisição
- ⚠️ **Complexidade** - API Gateway precisa propagar JWT para todos os serviços
- ⚠️ **Key sharing** - Todos os serviços precisam da mesma `JWT_SECRET`

**Mitigação dos Contras:**

```typescript
// API Gateway propaga JWT automaticamente
const response = await this.authClient.send(
  { cmd: "get_user" },
  { userId, token: context.token } // ← JWT propagado
);
```

```env
# .env compartilhado
JWT_SECRET=shared-secret-key-123  # TODO: usar vault em produção
```

**Decisão Final:** Implementar **defesa em profundidade** combinando:

1. **Isolamento de rede Docker** para performance e segurança base
2. **JWT Guards em todos os endpoints** para proteção contra vazamentos e ataques internos

Resultado: Microserviços **rápidos E seguros**, com proteção contra configurações erradas e comprometimento de containers.

### Paginação & Filtros

**Implementação:**

- Paginação com `page` e `limit` (max 100 itens)
- Metadados: `total`, `totalPages`, `page`, `limit`
- Filtros: título, status, prioridade, assignee, dueDate

**Por quê:**

- ✅ Performance: Evita carregar milhares de registros
- ✅ UX: Permite navegação eficiente
- ✅ Backend: Reduz carga do banco de dados

### TypeORM Migrations

**✅ IMPLEMENTADO:** O projeto utiliza TypeORM Migrations para gerenciamento de schema do banco de dados.

**Estrutura:**

Cada microserviço possui:

- `src/data-source.ts` - Configuração do DataSource para migrations
- `src/migrations/` - Diretório com os arquivos de migration
- Scripts npm para gerenciamento de migrations

**Scripts Disponíveis (por serviço):**

```bash
# Gerar nova migration
pnpm migration:generate src/migrations/NomeDaMigration

# Criar migration vazia
pnpm migration:create src/migrations/NomeDaMigration

# Executar migrations pendentes
pnpm migration:run

# Reverter última migration
pnpm migration:revert

# Ver status das migrations
pnpm migration:show
```

**Script Automatizado (PowerShell):**

O projeto inclui um script PowerShell para automatizar o processo de geração de migrations em todos os microserviços:

```powershell
# Executar o script
.\generate-migrations.ps1
```

**Opções do Script:**

1. **Limpar e recriar** - Derruba o banco, recria e gera migrations (ideal para desenvolvimento)
2. **Sincronizar** - Gera migrations preservando dados existentes

**Configuração:**

```typescript
// src/data-source.ts (exemplo)
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  // ...
  entities: ["src/**/*.entity.ts"],
  migrations: ["src/migrations/*.ts"],
  synchronize: false, // Sempre false para produção
});
```

**Migrations Atuais:**

- ✅ **auth-service**: Schema de usuários e autenticação
- ✅ **tasks-service**: Schema de tarefas, histórico, comentários e assignees
- ✅ **notifications-service**: Schema de notificações

---

## 📡 Endpoints da API

<details>
<summary><b>📋 Ver todos os endpoints disponíveis (clique para expandir)</b></summary>

<br/>

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

</details>

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

**Auth Service (11 testes unitários):**

- ✅ Login com credenciais válidas/inválidas
- ✅ Geração de tokens (access + refresh)
- ✅ Refresh token válido/inválido
- ✅ Logout
- ✅ Forgot/Reset password

**Tasks Service (15 testes unitários):**

- ✅ CRUD completo de tarefas
- ✅ Autorização (owner vs assignee)
- ✅ Paginação e filtros
- ✅ Comentários e histórico
- ✅ Notificações assíncronas

**API Gateway E2E (14 testes):**

- ✅ Auth: register, login, refresh, logout, forgot/reset password
- ✅ Tasks: CRUD completo, comentários, histórico
- ✅ Validação de autenticação JWT

**JWT Strategy (3 testes):**

- ✅ Validação de payload
- ✅ Extração de claims

### Testes E2E — Trade-offs

> Os testes E2E utilizam **mocks** ao invés de banco de dados real.

**✅ Vantagens:**

- Execução rápida (~50ms vs 5s+ com banco real)
- Independente de infraestrutura (não precisa `docker-compose up`)
- Testes determinísticos (sem dados residuais)
- Ideal para CI/CD (GitHub Actions)

**⚠️ Limitações:**

- Não testa integração real com microserviços
- Não valida queries SQL ou migrations
- Erros de comunicação HTTP não são detectados

**📌 Quando usar banco real:**

- Testes de regressão pré-deploy
- Validação de migrations
- Debug de problemas de integração

---

## 🐛 Problemas Conhecidos & Dívida Técnica

### 1. TasksService: Falta de Transações (Atomicidade) ⚠️

**Status:** Pendente

**Problema:** Métodos `create` e `update` salvam múltiplas entidades (Task, History, Assignees) sem transação.

**Risco:** Se o banco falhar no meio da operação, pode gerar dados inconsistentes (ex: Task criada sem histórico).

**Solução:** Envolver operações no `manager.transaction`.

### 2. TasksService: Race Condition em Assignees 🤔

**Status:** Pendente

**Problema:** Atualização de assignees faz `delete` total seguido de `insert`.

**Risco:** Em alta concorrência, dois updates simultâneos podem conflitar, com um apagando o trabalho do outro.

**Solução:** Implementar "upsert" ou diff inteligente de assignees.

### 3. NotificationsService: Loop Sequencial (Performance) 🐌

**Status:** Pendente

**Problema:** O `AppController` itera sobre recipientes usando `for...of` com `await`.

**Risco:** Latência aumenta linearmente com número de usuários. Se notificar 100 usuários, o 100º espera muito.

**Solução:** Usar `Promise.all` para paralelismo.

### 4. Frontend Error Boundary

**Status:** ✅ Resolvido

**Solução:** Implementado `GlobalErrorComponent` e `RootErrorBoundary`.

---

## 🚀 Melhorias Futuras

### Curto Prazo (1 semana)

- [ ] Upload de anexos em tarefas
- [ ] Update de conta (imagem, etc)

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

## 🚀 Possíveis Features Futuras

<details>
<summary><b>💡 Ver roadmap de features futuras (clique para expandir)</b></summary>

<br/>

### Melhorias de UX

- 🔄 **Filtros Compostos**
  - Multi-select para status (selecionar múltiplos status simultaneamente)
  - Multi-select para prioridades (filtrar por várias prioridades ao mesmo tempo)
  - Filtros combinados (ex: Alta/Urgente + Em Progresso/Em Revisão)
  - Salvar combinações de filtros favoritas

- 🗑️ **Gerenciamento de Tarefas**
  - Soft delete (marcar como deletada ao invés de remover permanentemente)
  - Hard delete com confirmação dupla
  - Restaurar tarefas deletadas (lixeira)
  - Arquivar tarefas concluídas

- 👤 **Tela de Perfil de Usuário**
  - Editar informações pessoais (nome, email, foto)
  - Alterar senha
  - Configurações de notificação
  - Avatar/foto de perfil com upload
  - Histórico de atividades
  - Estatísticas pessoais (tarefas criadas, concluídas, etc.)

### Hierarquia Organizacional

- 🏢 **Modelo Multi-tenant**
  ```
  Empresa (Tenant)
    └─ Projetos
        └─ Tarefas
            └─ Sub-tarefas
  ```
- **Benefícios:**
  - Isolamento de dados por empresa
  - Gerenciamento de múltiplos projetos
  - Relatórios por projeto/empresa
  - Métricas e dashboards por hierarquia

### Sistema RBAC (Role-Based Access Control)

- 👥 **Roles e Permissões**
  - **Owner** - Controle total da empresa/projeto
  - **Admin** - Gerenciar usuários e projetos
  - **Manager** - Criar e atribuir tarefas, ver relatórios
  - **Member** - Criar e editar suas tarefas
  - **Viewer** - Apenas visualização

- **Permissões Granulares:**
  - `tasks:create`, `tasks:read`, `tasks:update`, `tasks:delete`
  - `projects:manage`, `users:invite`, `reports:view`
  - Permissões customizáveis por empresa

### Outras Features

- 📊 **Analytics & Relatórios**
  - Dashboard com métricas (tarefas por status, tempo médio, etc.)
  - Gráficos de produtividade
  - Exportação de relatórios (PDF, CSV)

- 🔔 **Notificações Avançadas**
  - Preferências de notificação por usuário
  - Digest diário/semanal via email
  - Integração com Slack/Discord

- 📱 **Mobile App**
  - React Native para iOS/Android
  - Notificações push
  - Modo offline

- 🔍 **Busca Avançada**
  - Full-text search com Elasticsearch
  - Busca semântica
  - Filtros salvos e compartilháveis

</details>

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
