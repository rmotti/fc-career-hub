# Template — Documentação de Frontend

Use este template como base. Preencha todas as seções com informações reais do código analisado. Remova seções que não se aplicam.

---

```markdown
# [Nome do Projeto] — Frontend

![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5+-646CFF?logo=vite&logoColor=white)
<!-- Adicione/remova badges conforme a stack detectada -->

> Breve descrição do que este frontend faz, qual produto ele representa e para quem é destinado.

---

## Índice

- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Páginas e Rotas](#páginas-e-rotas)
- [Componentes Principais](#componentes-principais)
- [Gerenciamento de Estado](#gerenciamento-de-estado)
- [Integração com API](#integração-com-api)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Scripts](#scripts)
- [Deploy](#deploy)

---

## Pré-requisitos

- Node.js >= [versão detectada]
- npm ou yarn

---

## Instalação

```bash
git clone [url-do-repositorio]
cd [nome-do-projeto]
npm install
npm run dev
```

Acesse: `http://localhost:[porta detectada, ex: 5173]`

---

## Configuração

```bash
cp .env.example .env
```

Consulte a seção [Variáveis de Ambiente](#variáveis-de-ambiente) para detalhes.

---

## Estrutura de Pastas

```
src/
├── pages/           # Páginas da aplicação (uma por rota)
├── components/      # Componentes reutilizáveis
│   ├── ui/          # Componentes base (Button, Input, Modal, etc.)
│   └── [dominio]/   # Componentes específicos por domínio
├── hooks/           # Custom hooks React
├── services/        # Chamadas à API (axios/fetch organizados por recurso)
├── context/         # Context API para estado global
├── utils/           # Funções utilitárias
├── types/           # Tipos e interfaces TypeScript
├── assets/          # Imagens, ícones, fontes
└── App.tsx          # Componente raiz e configuração de rotas
```

<!-- Adaptar conforme estrutura real detectada -->

---

## Páginas e Rotas

| Rota | Componente/Página | Descrição | Auth |
|---|---|---|---|
| `/` | `HomePage` | Página inicial / Dashboard | 🔒 Privada |
| `/login` | `LoginPage` | Autenticação do usuário | 🔓 Pública |
| `/[recurso]` | `[Recurso]ListPage` | Listagem de [recurso] | 🔒 Privada |
| `/[recurso]/:id` | `[Recurso]DetailPage` | Detalhes de [recurso] | 🔒 Privada |
| `*` | `NotFoundPage` | Página 404 | 🔓 Pública |

<!-- Preencher com as rotas reais detectadas no React Router / Next.js / etc. -->

---

## Componentes Principais

| Componente | Localização | Descrição | Props principais |
|---|---|---|---|
| `[ComponenteA]` | `components/[pasta]` | [O que faz] | `prop1: tipo`, `prop2: tipo` |
| `[ComponenteB]` | `components/[pasta]` | [O que faz] | `prop1: tipo` |
<!-- Listar os componentes mais relevantes detectados no código -->

---

## Gerenciamento de Estado

<!-- Preencher conforme solução detectada -->

### Context API
O estado global é gerenciado via React Context. Contextos disponíveis:

| Context | Arquivo | Responsabilidade |
|---|---|---|
| `AuthContext` | `context/AuthContext.tsx` | Usuário autenticado, token, logout |
| `[OutroContext]` | `context/[Outro]Context.tsx` | [O que gerencia] |

### Zustand / Redux / Jotai
<!-- Se detectado, documentar stores e atoms -->

---

## Integração com API

Base URL configurada via variável de ambiente `VITE_API_URL`.

As chamadas à API são centralizadas na pasta `services/`:

```typescript
// Exemplo de como os serviços são organizados
import { api } from './api';  // instância axios configurada

export const [recursoService] = {
  getAll: () => api.get('/[recurso]'),
  getById: (id: string) => api.get(`/[recurso]/${id}`),
  create: (data: Create[Recurso]Dto) => api.post('/[recurso]', data),
  update: (id: string, data: Update[Recurso]Dto) => api.put(`/[recurso]/${id}`, data),
  delete: (id: string) => api.delete(`/[recurso]/${id}`),
};
```

**Autenticação**: O token JWT é incluído automaticamente via interceptor do axios no header `Authorization: Bearer <token>`.

---

## Variáveis de Ambiente

| Variável | Descrição | Exemplo | Obrigatória |
|---|---|---|---|
| `VITE_API_URL` | URL base da API backend | `http://localhost:3000/api` | ✅ Sim |
| `VITE_APP_NAME` | Nome da aplicação | `Varejo Inteligente` | ❌ Não |
<!-- Adicionar/remover conforme variáveis detectadas no código -->

> **Atenção**: No frontend com Vite, todas as variáveis de ambiente devem ter o prefixo `VITE_` para ficarem disponíveis no código. Com Next.js, o prefixo é `NEXT_PUBLIC_`.

---

## Scripts

```bash
npm run dev       # Inicia em modo desenvolvimento com hot reload
npm run build     # Gera build de produção em /dist
npm run preview   # Pré-visualiza o build de produção localmente
npm run lint      # Verifica erros de lint (ESLint)
npm run type-check # Verificação de tipos TypeScript sem compilar
```

---

## Deploy

### Vercel

```bash
npm run build
vercel deploy
```

Configure a variável `VITE_API_URL` apontando para a URL de produção da API.

### Build estático (Nginx / S3 / CDN)

```bash
npm run build
# Os arquivos estáticos estarão em /dist
# Sirva o index.html para todas as rotas (SPA routing)
```

Configuração de rewrite necessária para SPAs:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

<!-- Ajustar conforme plataforma detectada ou mencionada pelo usuário -->
```