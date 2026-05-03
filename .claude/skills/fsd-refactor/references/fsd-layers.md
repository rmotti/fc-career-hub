# FSD Layers — Camadas, Regras e Onde Cada Coisa Vai

## Estrutura completa de um projeto FSD

```
src/
├── app/          # Configuração global da aplicação
├── pages/        # Composição de telas (rotas)
├── widgets/      # Blocos compostos de UI (opcional)
├── features/     # Funcionalidades de negócio
├── entities/     # Entidades de domínio (opcional)
└── shared/       # Código verdadeiramente compartilhado
```

---

## Regra de importação (CRÍTICA)

As camadas só podem importar das camadas **abaixo** delas. Nunca de camadas acima.

```
app       →  pode importar de: pages, widgets, features, entities, shared
pages     →  pode importar de: widgets, features, entities, shared
widgets   →  pode importar de: features, entities, shared
features  →  pode importar de: entities, shared
entities  →  pode importar de: shared
shared    →  NÃO importa de ninguém
```

**Features não importam de outras features diretamente.** Se precisar de algo de outra feature, extraia para `shared/` ou use um `widget/` para compor as duas.

---

## Camada: `shared/`

Código sem nenhuma dependência de negócio. Se tem lógica de domínio, não é shared.

```
shared/
├── ui/           # Componentes genéricos (Button, Input, Modal, Badge)
├── lib/          # Utilitários e helpers (formatDate, cn, validators)
├── api/          # Configuração base do cliente HTTP (axios instance, fetcher)
├── config/       # Variáveis de ambiente, constantes globais
├── hooks/        # Hooks verdadeiramente genéricos (useDebounce, useLocalStorage)
└── types/        # Tipos e interfaces globais (ApiResponse<T>, PaginatedList<T>)
```

**O que vai aqui:**
- `utils/formatDate.ts` → `shared/lib/formatDate.ts`
- `utils/cn.ts` → `shared/lib/cn.ts`
- `lib/axios.ts` → `shared/api/client.ts`
- `components/Button.tsx` → `shared/ui/Button.tsx`
- `components/Input.tsx` → `shared/ui/Input.tsx`
- `hooks/useDebounce.ts` → `shared/hooks/useDebounce.ts`
- `config/env.ts` → `shared/config/env.ts`

**O que NÃO vai aqui:**
- Qualquer coisa que menciona "user", "product", "order", "auth" na lógica — isso é domínio, vai para `entities/` ou `features/`

---

## Camada: `entities/` (opcional)

Representa os objetos de negócio centrais do sistema. Use quando entidades são usadas por múltiplas features.

```
entities/
└── user/
    ├── ui/         # UserAvatar, UserCard (exibição pura da entidade)
    ├── model/      # tipos, schema zod, store slice da entidade
    ├── api/        # queries de leitura da entidade (getUser, getUserById)
    └── index.ts    # exporta apenas o que é público
```

**O que vai aqui:**
- Tipo `User`, `Product`, `Order` com seus campos
- Componentes que só exibem a entidade (sem ações de negócio)
- Queries de leitura simples

**O que NÃO vai aqui:**
- Ações de negócio (login, addToCart) — isso vai em `features/`

---

## Camada: `features/`

O coração do FSD. Cada feature é uma funcionalidade que o **usuário executa**.

```
features/
└── auth/
    ├── ui/         # Componentes da feature (LoginForm, RegisterForm)
    ├── model/      # Estado, hooks, contextos da feature (useAuth, AuthContext, authStore)
    ├── api/        # Chamadas de API da feature (login, register, logout)
    └── index.ts    # public API da feature
```

### Segmentos dentro de uma feature

| Segmento | O que vai | Exemplos |
|----------|-----------|---------|
| `ui/`    | Componentes React da feature | `LoginForm.tsx`, `ProductCard.tsx` |
| `model/` | Hooks, Context, store slices, tipos locais | `useAuth.ts`, `AuthContext.tsx`, `authSlice.ts` |
| `api/`   | Funções de chamada à API, React Query hooks | `authApi.ts`, `useLoginMutation.ts` |

### Regra do `index.ts`

Cada feature **obrigatoriamente** tem um `index.ts` que é a única porta de entrada:

```typescript
// features/auth/index.ts
export { LoginForm } from './ui/LoginForm'
export { useAuth } from './model/useAuth'
export type { AuthUser } from './model/types'
// NÃO exporta: detalhes internos, funções auxiliares privadas
```

Quem está fora da feature importa assim:
```typescript
import { LoginForm, useAuth } from '@/features/auth'
// NUNCA: import { LoginForm } from '@/features/auth/ui/LoginForm'
```

### Exemplos de features comuns

```
features/
├── auth/              # login, logout, register, sessão
├── cart/              # adicionar/remover itens, calcular total
├── checkout/          # fluxo de pagamento
├── product-search/    # busca e filtros de produtos
├── user-profile/      # editar perfil, avatar
├── notifications/     # marcar como lida, listar
└── dashboard-stats/   # métricas e gráficos do dashboard
```

---

## Camada: `widgets/` (opcional)

Composições grandes de UI que combinam múltiplas features numa seção reutilizável de página.

```
widgets/
└── header/
    ├── ui/
    │   └── Header.tsx   # usa features/auth + features/cart
    └── index.ts
```

**Use quando:** um bloco de UI é reutilizado em múltiplas páginas E combina mais de uma feature.

**Não use para:** componentes de uma só feature (fica dentro da feature mesmo).

---

## Camada: `pages/`

Composição final de uma rota. Páginas são finas — só montam o layout e conectam widgets/features.

```
pages/
├── LoginPage.tsx
├── DashboardPage.tsx
└── ProductDetailPage.tsx
```

```typescript
// pages/DashboardPage.tsx — página fina, só compõe
import { Header } from '@/widgets/header'
import { DashboardStats } from '@/features/dashboard-stats'
import { RecentOrders } from '@/features/orders'

export function DashboardPage() {
  return (
    <>
      <Header />
      <DashboardStats />
      <RecentOrders />
    </>
  )
}
```

**Páginas NÃO contêm:** lógica de negócio, chamadas de API diretas, estado local complexo.

---

## Camada: `app/`

Configuração global que roda uma vez na inicialização.

```
app/
├── providers/     # Todos os providers (QueryClientProvider, AuthProvider, ThemeProvider)
├── router/        # Definição de rotas (React Router, TanStack Router)
├── styles/        # CSS global, tema
└── index.tsx      # Ponto de entrada, compõe providers
```

---

## Aliases de path recomendados (vite.config.ts / tsconfig.json)

```typescript
// vite.config.ts
resolve: {
  alias: {
    '@/shared':   '/src/shared',
    '@/entities': '/src/entities',
    '@/features': '/src/features',
    '@/widgets':  '/src/widgets',
    '@/pages':    '/src/pages',
    '@/app':      '/src/app',
  }
}
```