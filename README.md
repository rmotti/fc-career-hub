# ⚽ FC Career Hub

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss&logoColor=white)

Uma aplicação web para **gerenciar e acompanhar seus saves do Modo Carreira** do FC. Permite criar múltiplos saves, gerenciar elencos, registrar transferências, acompanhar estatísticas de temporada e manter o histórico completo da sua carreira como treinador.

---

## 🛠️ Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| **Framework** | React 18 + TypeScript 5 |
| **Build Tool** | Vite 5 |
| **Estilização** | TailwindCSS 3 + `tailwindcss-animate` |
| **UI Components** | shadcn/ui (Radix UI primitives) |
| **Roteamento** | React Router DOM v6 |
| **Estado do Servidor** | TanStack React Query v5 |
| **Formulários** | React Hook Form + Zod |
| **Gráficos** | Recharts |
| **Ícones** | Lucide React |
| **Notificações** | Sonner |
| **Temas** | next-themes |
| **Testes** | Vitest + Testing Library + Playwright |
| **HTTP Client** | Fetch API nativa |

---

## 🚀 Como Executar

```bash
# Instalar dependências
npm install

# Rodar em modo de desenvolvimento
npm run dev

# Build para produção
npm run build

# Rodar testes
npm run test

# Rodar testes em modo watch
npm run test:watch
```

O servidor de desenvolvimento sobe em `http://localhost:8080`.

---

## 🌐 Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | URL base da API backend |

Crie um arquivo `.env.local` na raiz com:

```env
VITE_API_URL=https://sua-api.com
```

---

## 📋 Funcionalidades

### 1. Autenticação
- Cadastro e login com token JWT armazenado em `localStorage`
- Sessão persistida entre recarregamentos via `AuthContext`
- Rotas protegidas (`ProtectedRoute`) e rotas públicas exclusivas (`PublicOnlyRoute`)

### 2. Seleção e Criação de Saves
- Tela inicial com lista de saves existentes (com clube, temporada e troféus)
- Criação de novo save com nome customizado e seleção de clube inicial

### 3. Dashboard (Visão Geral)
- **Orçamento e Saldo** — Visualização lado a lado das finanças do clube
- **Alertas Financeiros** — Destaque visual quando o saldo está abaixo de 20% do orçamento
- **Máscaras de Moeda** — Formatação automática (`€XK` para milhares, `€XM` para milhões)
- **Artilheiro** — Jogador com mais gols no elenco
- **Troféus** — Total de troféus conquistados
- **Temporada Atual** — Retrospecto de vitórias, empates e derrotas
- **Top 5 Artilheiros** — Ranking dos melhores marcadores

### 4. Elenco (Squad)
- Tabela completa de jogadores com **ordenação por coluna** (nome, posição, idade, OVR, gols, assistências, salário, valor de mercado)
- Badges de posição coloridos (GOL, ZAG, MEI, ATA)
- Destaque de OVR por faixa (≥83 primário, ≥80 accent)
- **Badges de perfil** — Elite, Artilheiro, Garçom, Motor, Em Ascensão, Promessa, Diamante, Veterano
- **CRUD de jogadores** — adicionar, editar, visualizar e remover jogadores via modal
- Campos do jogador: nome, posição, idade, OVR, gols, assistências, salário, valor de mercado, cartões amarelos/vermelhos, status (Crucial / Important / Role / Sporadic / Promising)

### 5. Estatísticas da Temporada
- **Cards Resumo** — Gols Pró, Gols Contra e Posse de Bola
- **Campos de Competição** — Posição na Liga, Resultado na Copa Europeia e Copa Nacional
- **Rankings** — Top 5 Artilheiros, Top 5 Assistentes e Top 5 Cartões
- **Edição de Stats** — Modal para atualização rápida de todos os dados do time na temporada

### 6. Avançar Temporada (End-of-Season)
- **Fluxo em 3 etapas** — Confirmação → Resumo Geral → Celebração
- **Resumo Financeiro e Técnico** — Saldo final, artilheiros e garçons da temporada encerrada
- **Criação Automática de Troféus** — Títulos detectados e adicionados automaticamente à vitrine
- **Modal de Celebração** — Animado para novas conquistas

### 7. Transferências
- **Duas abas** — Janela Atual e Histórico completo
- **Controle Orçamentário** — Saldo atualizado automaticamente ao registrar compras ou vendas
- **CRUD de Transferências** — Adicionar, editar e remover via modal com máscaras de valor
- **Histórico Global** — Todas as transferências ordenadas por temporada e clube

### 8. História (Legado do Save)
- **Vitrine de Troféus** — Títulos com identificação por cores (Liga, Continental, Copas) e clube
- **Clubes Gerenciados** — Passagens com período e retrospecto técnico
- **Recordes do Save** — Maior compra, maior venda, artilheiro e assistente histórico
- **Estatísticas Globais** — Total de jogos e retrospecto de toda a carreira

### 9. Mudar de Clube
- Grid de clubes disponíveis para selecionar novo clube
- Preserva histórico global ao trocar de clube
- Reseta elenco, orçamento e estatísticas para o novo clube

---

## 🗺️ Rotas

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/` | `Index` | Redireciona para `SaveSelect` ou `/hub/dashboard` |
| `/login` | `Login` | Autenticação do usuário |
| `/register` | `Register` | Cadastro de novo usuário |
| `/pricing` | `Pricing` | Planos e preços |
| `/hub` | `HubLayout` | Layout base com sidebar e header |
| `/hub/dashboard` | `Dashboard` | Visão geral do save |
| `/hub/squad` | `Squad` | Elenco com CRUD de jogadores |
| `/hub/stats` | `Stats` | Estatísticas da temporada atual |
| `/hub/history` | `History` | Histórico de troféus e clubes |
| `/hub/transfers` | `Transfers` | Transferências e histórico financeiro |
| `/hub/change-club` | `ChangeClub` | Seleção de novo clube |
| `/hub/field` | `Field` | Visualização de formação/campo |
| `/unauthorized` | `Unauthorized` | Acesso negado |
| `/*` | `NotFound` | Página 404 |

---

## 📁 Estrutura do Projeto

```
src/
├── App.tsx                        # Roteamento principal
├── main.tsx                       # Entry point
├── index.css                      # Estilos globais
├── components/
│   ├── AuthPageLayout.tsx         # Layout das páginas de auth
│   ├── AuthHubShowcase.tsx        # Showcase exibido nas telas de auth
│   ├── AuthStatusScreen.tsx       # Tela de status de autenticação
│   ├── AuthGuards.tsx             # ProtectedRoute e PublicOnlyRoute
│   ├── SaveSelect.tsx             # Tela de seleção/criação de saves
│   ├── NavLink.tsx                # Link de navegação da sidebar
│   ├── Logo.tsx                   # Componente de logo
│   ├── hub/
│   │   ├── HubSidebar.tsx         # Sidebar de navegação
│   │   ├── HubHeader.tsx          # Header com save/clube/temporada
│   │   ├── DashboardScreen.tsx    # Tela Visão Geral
│   │   ├── SquadScreen.tsx        # Tela Elenco
│   │   ├── StatsScreen.tsx        # Tela Estatísticas
│   │   ├── HistoryScreen.tsx      # Tela História
│   │   ├── TransfersScreen.tsx    # Tela Transferências
│   │   ├── ChangeClubScreen.tsx   # Tela Mudar de Clube
│   │   ├── FieldScreen.tsx        # Tela de Formação/Campo
│   │   └── StatCard.tsx           # Card reutilizável de estatística
│   ├── modals/
│   │   ├── PlayerModal.tsx        # Adicionar/Editar jogador
│   │   ├── PlayerViewModal.tsx    # Visualizar detalhes do jogador
│   │   ├── StatsModal.tsx         # Editar estatísticas do time
│   │   ├── TransferModal.tsx      # Registrar transferência
│   │   └── NewSeasonModal.tsx     # Encerramento de temporada + celebração
│   └── ui/                        # Componentes shadcn/ui (~40 componentes)
├── contexts/
│   └── AuthContext.tsx            # Contexto de autenticação (user, session, signIn, signOut)
├── hooks/
│   ├── useSaves.ts                # CRUD de saves
│   ├── usePlayers.ts              # CRUD de jogadores + stats
│   ├── useTransfers.ts            # CRUD de transferências
│   ├── useTeamStats.ts            # Estatísticas do time
│   ├── useTrophies.ts             # CRUD de troféus
│   ├── useClubs.ts                # Lista de clubes
│   ├── useClubStints.ts           # Passagens por clubes + mudar clube
│   ├── useCompetitions.ts         # Lista de competições
│   ├── useFinancialSnapshot.ts    # Snapshot financeiro (orçamento + saldo calculado)
│   ├── use-mobile.tsx             # Detecção de mobile
│   └── use-toast.ts               # Sistema de toast
├── services/
│   └── api.ts                     # Cliente HTTP centralizado + tipos da API
├── lib/
│   ├── utils.ts                   # Helper cn() para classes TailwindCSS
│   └── auth-storage.ts            # Persistência de sessão no localStorage
└── utils/
    ├── currency.ts                # Formatação e parsing de valores monetários
    ├── finance.ts                 # Cálculo de saldo a partir de transferências
    ├── rounding.ts                # Arredondamento de decimais
    ├── playerBadge.ts             # Badges de perfil do jogador (Elite, Artilheiro, etc.)
    ├── playerTransferStatus.ts    # Status de transferência dos jogadores
    ├── competitions.ts            # Dados de competições e copas
    ├── leagues.ts                 # Dados de ligas
    └── countries.ts               # Dados de países/nações
```

---

## 📊 Modelo de Dados (API)

### `ApiSave`
Save do Modo Carreira com: nome, temporada atual, orçamento e referência ao clube atual via `clubStintId`.

### `ApiClubStint`
Passagem por um clube com: save, clube, temporada de início/fim, retrospecto (vitórias, empates, derrotas) e flag de clube atual.

### `ApiPlayer`
Jogador do elenco com: nome, posição (`GOL / ZAG / MEI / ATA`), idade, OVR, salário, valor de mercado, status e estatísticas da temporada.

### `ApiPlayerSeasonStats`
Estatísticas de temporada do jogador: gols, assistências, cartões amarelos e vermelhos.

### `ApiTeamStats`
Estatísticas do time por temporada: gols pró/contra, posse, vitórias, empates, derrotas, posição na liga, resultado nas copas.

### `ApiTransfer`
Transferência com: jogador, tipo (`buy / sell`), clubes de origem e destino, valor e temporada.

### `ApiTrophy`
Troféu conquistado com: competição, ano e clube.

### `ApiCompetition`
Competição com: nome, tipo (`league / national_cup / european_cup`) e país.

---

## 🎨 Design

- **Dark mode** por padrão via `next-themes`
- UI com estética **gamer/esportiva** com efeitos de glow e bordas estilizadas
- Paleta semântica: `primary` (destaque), `accent` (secundário), `destructive` (perigo/derrotas), `warning` (atenção/empates), `gold` (troféus)
- Totalmente responsivo com grid adaptativo
