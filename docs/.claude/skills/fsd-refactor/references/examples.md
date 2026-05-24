# Exemplos Reais — Antes e Depois da Migração FSD

## Exemplo 1: Feature de autenticação completa

### Estrutura da feature

```
features/auth/
├── ui/
│   ├── LoginForm.tsx
│   └── LogoutButton.tsx
├── model/
│   ├── useAuth.ts
│   ├── AuthContext.tsx
│   └── types.ts
├── api/
│   └── authApi.ts
└── index.ts
```

### `features/auth/model/types.ts`
```typescript
export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
}

export interface LoginCredentials {
  email: string
  password: string
}
```

### `features/auth/api/authApi.ts`
```typescript
import { client } from '@/shared/api/client'
import type { AuthUser, LoginCredentials } from '../model/types'

export async function login(credentials: LoginCredentials): Promise<AuthUser> {
  const { data } = await client.post('/auth/login', credentials)
  return data
}

export async function logout(): Promise<void> {
  await client.post('/auth/logout')
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await client.get('/auth/me')
  return data
}
```

### `features/auth/model/useAuth.ts`
```typescript
import { useContext } from 'react'
import { AuthContext } from './AuthContext'

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
```

### `features/auth/model/AuthContext.tsx`
```typescript
import { createContext, useState, useEffect, type ReactNode } from 'react'
import { getMe, login, logout } from '../api/authApi'
import type { AuthUser, LoginCredentials } from './types'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  async function handleLogin(credentials: LoginCredentials) {
    const user = await login(credentials)
    setUser(user)
  }

  async function handleLogout() {
    await logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login: handleLogin, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### `features/auth/ui/LoginForm.tsx`
```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { useAuth } from '../model/useAuth'

export function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await login({ email, password })
      navigate('/dashboard')
    } catch {
      setError('Credenciais inválidas')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
      <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" />
      {error && <p>{error}</p>}
      <Button type="submit">Entrar</Button>
    </form>
  )
}
```

### `features/auth/index.ts` — a public API
```typescript
// UI
export { LoginForm } from './ui/LoginForm'
export { LogoutButton } from './ui/LogoutButton'

// Model
export { AuthProvider } from './model/AuthContext'
export { useAuth } from './model/useAuth'

// Types
export type { AuthUser } from './model/types'

// NÃO exporta: authApi, AuthContext diretamente, detalhes internos
```

---

## Exemplo 2: shared/ui — componente genérico

### `shared/ui/Button.tsx`
```typescript
import { type ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded font-medium transition-colors',
        variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
        variant === 'secondary' && 'bg-gray-100 text-gray-900 hover:bg-gray-200',
        variant === 'ghost' && 'bg-transparent hover:bg-gray-100',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2 text-base',
        size === 'lg' && 'px-6 py-3 text-lg',
        className
      )}
      {...props}
    />
  )
}
```

---

## Exemplo 3: pages/ — página fina

### `pages/LoginPage.tsx`
```typescript
// CORRETO — página fina, sem lógica
import { LoginForm } from '@/features/auth'

export function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <h1>Bem-vindo</h1>
        <LoginForm />
      </div>
    </main>
  )
}
```

---

## Exemplo 4: app/providers

### `app/providers/index.tsx`
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/features/auth'
import type { ReactNode } from 'react'

const queryClient = new QueryClient()

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  )
}
```

---

## Exemplo 5: widget compondo features

### `widgets/header/ui/Header.tsx`
```typescript
// Combina features/auth e features/cart — por isso é widget, não feature
import { useAuth, LogoutButton } from '@/features/auth'
import { CartIcon } from '@/features/cart'
import { Link } from 'react-router-dom'

export function Header() {
  const { user } = useAuth()

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <Link to="/">Logo</Link>
      <nav className="flex items-center gap-4">
        <CartIcon />
        {user ? (
          <>
            <span>{user.name}</span>
            <LogoutButton />
          </>
        ) : (
          <Link to="/login">Entrar</Link>
        )}
      </nav>
    </header>
  )
}
```

---

## Erros comuns e como corrigir

### ❌ Importação cruzada entre features
```typescript
// features/checkout/ui/CheckoutForm.tsx — ERRADO
import { useAuth } from '@/features/auth/model/useAuth'  // importação direta internamente
```

```typescript
// CORRETO — importar via index.ts da feature
import { useAuth } from '@/features/auth'
```

### ❌ Shared importando de feature
```typescript
// shared/ui/Avatar.tsx — ERRADO
import { useAuth } from '@/features/auth'  // shared não pode depender de feature
```

```typescript
// CORRETO — receba o dado como prop
interface AvatarProps {
  src: string
  name: string
}
export function Avatar({ src, name }: AvatarProps) { ... }
```

### ❌ Lógica de negócio na page
```typescript
// pages/ProductPage.tsx — ERRADO
export function ProductPage() {
  const [products, setProducts] = useState([])
  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts)
  }, [])
  return <div>{products.map(...)}</div>
}
```

```typescript
// CORRETO — delega para feature
import { ProductList } from '@/features/product-catalog'
export function ProductPage() {
  return <ProductList />
}
```