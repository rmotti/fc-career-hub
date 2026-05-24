# Migration Map — De estrutura por tipo para FSD

## Mapa geral por pasta de origem

### `src/components/`

Componentes genéricos (sem lógica de negócio) → `shared/ui/`
Componentes de uma feature específica → `features/<nome>/ui/`
Componentes que compõem múltiplas features → `widgets/<nome>/ui/`

| Critério para identificar | Destino |
|--------------------------|---------|
| Sem props de domínio (Button, Input, Modal, Spinner) | `shared/ui/` |
| Props com tipos de domínio (UserCard, ProductBadge) | `features/<domain>/ui/` ou `entities/<domain>/ui/` |
| Combina dois domínios diferentes (Header com auth + cart) | `widgets/` |
| É uma seção inteira de uma página específica | `pages/` inline ou `widgets/` |

---

### `src/hooks/`

| Hook | Destino | Critério |
|------|---------|---------|
| `useDebounce.ts` | `shared/hooks/useDebounce.ts` | Sem domínio |
| `useLocalStorage.ts` | `shared/hooks/useLocalStorage.ts` | Sem domínio |
| `useMediaQuery.ts` | `shared/hooks/useMediaQuery.ts` | Sem domínio |
| `useAuth.ts` | `features/auth/model/useAuth.ts` | Lógica de auth |
| `useCart.ts` | `features/cart/model/useCart.ts` | Lógica de carrinho |
| `useUser.ts` | `entities/user/model/useUser.ts` ou `features/user-profile/model/useUser.ts` | Depende se é leitura pura ou ação |
| `useProducts.ts` | `features/product-search/model/useProducts.ts` | Lógica de busca |
| `usePagination.ts` | `shared/hooks/usePagination.ts` | Genérico |

**Regra:** se o nome do hook menciona uma entidade de negócio (user, product, order, auth), ele vai para a feature correspondente no segmento `model/`.

---

### `src/services/` ou `src/api/`

| Arquivo | Destino | Critério |
|---------|---------|---------|
| `authService.ts` | `features/auth/api/authApi.ts` | Chamadas de auth |
| `userService.ts` | `entities/user/api/userApi.ts` ou `features/user-profile/api/` | Leitura pura → entities, ação → features |
| `productService.ts` | `features/product-search/api/productApi.ts` | Depende da feature principal |
| `orderService.ts` | `features/checkout/api/orderApi.ts` | Fluxo de compra |
| `api.ts` ou `client.ts` (axios instance) | `shared/api/client.ts` | Configuração base |
| `interceptors.ts` | `shared/api/interceptors.ts` | Configuração base |

---

### `src/contexts/`

| Context | Destino |
|---------|---------|
| `AuthContext.tsx` | `features/auth/model/AuthContext.tsx` |
| `ThemeContext.tsx` | `app/providers/ThemeProvider.tsx` |
| `CartContext.tsx` | `features/cart/model/CartContext.tsx` |
| `NotificationContext.tsx` | `features/notifications/model/NotificationContext.tsx` |

**Regra:** context de negócio → `features/<nome>/model/`. Context de configuração global → `app/providers/`.

---

### `src/utils/` ou `src/lib/`

| Arquivo | Destino | Critério |
|---------|---------|---------|
| `formatDate.ts` | `shared/lib/formatDate.ts` | Genérico |
| `formatCurrency.ts` | `shared/lib/formatCurrency.ts` | Genérico |
| `cn.ts` (classnames) | `shared/lib/cn.ts` | Genérico |
| `validators.ts` | `shared/lib/validators.ts` | Genérico |
| `axios.ts` / `fetchClient.ts` | `shared/api/client.ts` | Configuração de rede |
| `constants.ts` | `shared/config/constants.ts` | Constantes globais |
| `queryClient.ts` | `app/providers/queryClient.ts` | Configuração global |

---

### `src/pages/`

Páginas permanecem em `pages/`, mas devem ser **refatoradas para ficarem finas**:

```typescript
// ANTES — página gorda com lógica inline
export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  async function handleLogin() {
    const res = await fetch('/api/auth/login', { ... })
    // ... lógica de auth
  }

  return (
    <div>
      <input value={email} onChange={...} />
      <input value={password} onChange={...} />
      <button onClick={handleLogin}>Login</button>
    </div>
  )
}

// DEPOIS — página fina que delega para a feature
import { LoginForm } from '@/features/auth'

export function LoginPage() {
  return (
    <div className="auth-layout">
      <LoginForm />
    </div>
  )
}
```

---

### `src/data/`

| Arquivo | Destino | Critério |
|---------|---------|---------|
| `mockUsers.ts` | `shared/lib/mocks/users.ts` ou `entities/user/model/mocks.ts` | Se usado em testes gerais → shared; se só de user → entity |
| `constants/routes.ts` | `shared/config/routes.ts` | Constantes de rota |
| `constants/permissions.ts` | `shared/config/permissions.ts` | Constantes globais |

---

### `src/types/` ou `src/interfaces/`

| Arquivo | Destino | Critério |
|---------|---------|---------|
| `User.ts` | `entities/user/model/types.ts` (exportado via index) | Tipo de entidade |
| `Product.ts` | `entities/product/model/types.ts` | Tipo de entidade |
| `ApiResponse.ts` | `shared/types/api.ts` | Tipo genérico de infraestrutura |
| `Pagination.ts` | `shared/types/pagination.ts` | Tipo genérico |
| `FormField.ts` | `shared/types/form.ts` | Tipo genérico de UI |

---

## Checklist por arquivo durante a migração

Para cada arquivo, responda em ordem:

1. **É genérico?** (sem menção a domínio de negócio) → `shared/`
2. **Pertence a uma feature específica?** → `features/<nome>/<segmento>/`
3. **É um tipo de entidade puro?** → `entities/<nome>/model/`
4. **Combina múltiplas features?** → `widgets/`
5. **Configura a aplicação globalmente?** → `app/`

---

## Exemplo de migração completa

### Projeto original
```
src/
├── components/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── LoginForm.tsx
│   ├── ProductCard.tsx
│   ├── Header.tsx
│   └── Spinner.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useCart.ts
│   └── useDebounce.ts
├── services/
│   ├── authService.ts
│   ├── productService.ts
│   └── api.ts
├── contexts/
│   ├── AuthContext.tsx
│   └── CartContext.tsx
├── utils/
│   ├── formatCurrency.ts
│   └── cn.ts
└── pages/
    ├── LoginPage.tsx
    ├── HomePage.tsx
    └── ProductPage.tsx
```

### Após migração FSD
```
src/
├── app/
│   ├── providers/
│   │   └── index.tsx        # compõe todos os providers
│   └── router/
│       └── index.tsx
├── pages/
│   ├── LoginPage.tsx        # fina — só monta LoginForm
│   ├── HomePage.tsx         # fina — monta Header + seções
│   └── ProductPage.tsx      # fina — monta ProductDetail
├── widgets/
│   └── header/
│       ├── ui/Header.tsx    # combina auth + cart
│       └── index.ts
├── features/
│   ├── auth/
│   │   ├── ui/LoginForm.tsx
│   │   ├── model/useAuth.ts
│   │   ├── model/AuthContext.tsx
│   │   ├── api/authApi.ts
│   │   └── index.ts
│   └── cart/
│       ├── model/useCart.ts
│       ├── model/CartContext.tsx
│       └── index.ts
├── entities/
│   └── product/
│       ├── ui/ProductCard.tsx
│       └── index.ts
└── shared/
    ├── ui/
    │   ├── Button.tsx
    │   ├── Input.tsx
    │   └── Spinner.tsx
    ├── api/
    │   └── client.ts        # axios instance
    ├── hooks/
    │   └── useDebounce.ts
    └── lib/
        ├── formatCurrency.ts
        └── cn.ts
```