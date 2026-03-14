# ⚽ FC 26 Career Mode Hub

Uma aplicação web para **gerenciar e acompanhar seus saves do Modo Carreira** do EA FC 26. Permite criar múltiplos saves, gerenciar elencos, registrar transferências, acompanhar estatísticas de temporada e manter o histórico completo da sua carreira como treinador.

## 🛠️ Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| **Framework** | React 18 + TypeScript |
| **Build Tool** | Vite 5 |
| **Estilização** | TailwindCSS 3 + `tailwindcss-animate` |
| **UI Components** | shadcn/ui (Radix UI primitives) |
| **Roteamento** | React Router DOM v6 |
| **Estado do Servidor** | TanStack React Query |
| **Formulários** | React Hook Form + Zod |
| **Gráficos** | Recharts |
| **Ícones** | Lucide React |
| **Testes** | Vitest + Testing Library + Playwright |

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
```

---

## 📋 Funcionalidades

### 1. Seleção e Criação de Saves
- Tela inicial com lista de saves existentes (com clube, temporada e troféus)
- Criação de novo save com nome customizado e seleção de clube inicial (16 clubes disponíveis)

### 2. Dashboard (Visão Geral)
- **Orçamento e Saldo** — Visualização lado a lado das finanças do clube.
- **Alertas Financeiros** — Destaque visual e alertas quando o saldo está abaixo de 20% do orçamento.
- **Máscaras de Moeda** — Formatação automática em formato de moeda do jogo (`€XK` para milhares, `€XM` para milhões).
- **Artilheiro** — Jogador com mais gols no elenco.
- **Troféus** — total de troféus conquistados.
- **Temporada Atual** — Retrospecto de vitórias, empates e derrotas.
- **Top 5 Artilheiros** — Ranking dos melhores marcadores.

### 3. Elenco (Squad)
- Tabela completa de jogadores com **ordenação por coluna** (nome, posição, idade, OVR, gols, assistências, salário, valor de mercado)
- Badges de posição coloridos (GOL, ZAG, MEI, ATA)
- Destaque de OVR por faixa (≥83 primário, ≥80 accent)
- **CRUD de jogadores** — adicionar, editar e remover jogadores via modal
- Campos do jogador: nome, posição, idade, OVR, gols, assistências, salário, valor de mercado, cartões amarelos/vermelhos, status (Crucial / Important / Role / Sporadic / Promising)

### 4. Estatísticas da Temporada
- **Cards Resumo** — Gols Pró, Gols Contra e Posse de Bola.
- **Novos Campos** — Acompanhamento de **Posição na Liga**, **Resultado na Copa Europeia** e **Resultado na Copa Nacional**.
- **Rankings** — Top 5 Artilheiros, Top 5 Assistentes e Top 5 Cartões.
- **Edição de Stats** — Modal para atualização rápida de todos os dados do time na temporada.

### 5. Avançar Temporada (End-of-Season)
- **Fluxo de Encerramento** — Processo em 3 etapas (Confirmação, Resumo Geral e Celebração).
- **Resumo Financeiro e Técnico** — Exibição de saldo final, artilheiros e garçons da temporada que finda.
- **Criação Automática de Troféus** — Títulos de liga e copas são detectados e adicionados automaticamente à vitrine.
- **Celebração de Títulos** — Modal animado para comemorar novas conquistas ao iniciar uma nova temporada.

### 6. Transferências
- **Duas abas** — Janela Atual e Histórico.
- **Controle Orçamentário** — O saldo do save é atualizado automaticamente ao registrar compras ou vendas.
- **CRUD de Transferências** — Adicionar, editar e remover via modal com máscaras de valor de mercado.
- **Histórico Completo** — Todas as transferências ordenadas por ano e clube.

### 7. História (Legado do Save)
- **Vitrine de Troféus** — Exibição visual dos títulos com identificação por cores (Liga, Continental, Copas) e nome do clube.
- **Clubes Gerenciados** — Registro de passagens com período e retrospecto técnico.
- **Recordes do Save** — Maior compra, maior venda, artilheiro e assistente histórico acumulados.
- **Estatísticas Globais** — Total de jogos e retrospecto de toda a carreira.

### 8. Mudar de Clube
- Grid de clubes disponíveis para selecionar novo clube
- Preserva histórico global ao mudar de clube
- Reseta elenco, orçamento e estatísticas para o novo clube

---

## 🗺️ Mapeamento de Rotas e Telas

### Rotas (React Router)

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/` | `Index` | Página principal — exibe `SaveSelect` ou o Hub com sidebar |
| `/*` | `NotFound` | Página 404 para rotas não encontradas |

### Navegação Interna (Sidebar — via state)

A aplicação utiliza **navegação por estado** (`screen`) em vez de rotas separadas. A sidebar controla qual tela é renderizada dentro do Hub:

| Screen ID | Label (PT-BR) | Componente | Descrição |
|-----------|---------------|-----------|-----------|
| `dashboard` | Visão Geral | `DashboardScreen` | Resumo do save com stats, próximo jogo e artilheiros |
| `squad` | Elenco | `SquadScreen` | Tabela de jogadores com CRUD (abre `PlayerModal`) |
| `stats` | Estatísticas | `StatsScreen` | Stats da temporada com rankings (abre `StatsModal`) |
| `history` | História | `HistoryScreen` | Legado: troféus, clubes, recordes |
| `transfers` | Transferências | `TransfersScreen` | Contratações/vendas com CRUD (abre `TransferModal`) |
| `changeClub` | Mudar de Clube | `ChangeClubScreen` | Seleção de novo clube para gerenciar |

### Modais

| Modal | Disparado em | Função |
|-------|-------------|--------|
| `PlayerModal` | `SquadScreen` | Adicionar/Editar jogador com máscaras de moeda |
| `StatsModal` | `StatsScreen` | Editar stats do time (incluindo liga e copas) |
| `TransferModal` | `TransfersScreen` | Registrar transferências com impacto no saldo |
| `NewSeasonModal` | `HubHeader` | Fluxo de encerramento de temporada e celebração |

---

## 📁 Estrutura do Projeto

```
src/
├── App.tsx                        # Roteamento principal
├── main.tsx                       # Entry point
├── index.css                      # Estilos globais
├── App.css                        # Estilos do App
├── components/
│   ├── SaveSelect.tsx             # Tela de seleção/criação de saves
│   ├── NavLink.tsx                # Link de navegação
│   ├── hub/
│   │   ├── HubSidebar.tsx         # Sidebar de navegação do Hub
│   │   ├── HubHeader.tsx          # Header com nome do save/clube/temporada
│   │   ├── DashboardScreen.tsx    # Tela Visão Geral
│   │   ├── SquadScreen.tsx        # Tela Elenco
│   │   ├── StatsScreen.tsx        # Tela Estatísticas
│   │   ├── HistoryScreen.tsx      # Tela História
│   │   ├── TransfersScreen.tsx    # Tela Transferências
│   │   ├── ChangeClubScreen.tsx   # Tela Mudar de Clube
│   │   └── StatCard.tsx           # Card reutilizável de estatística
│   ├── modals/
│   │   ├── PlayerModal.tsx        # Modal de jogador
│   │   ├── StatsModal.tsx         # Modal de estatísticas do time
│   │   └── TransferModal.tsx      # Modal de transferência
│   └── ui/                        # Componentes shadcn/ui
├── data/
│   └── mockData.ts                # Tipos (interfaces) + dados mock
├── hooks/
│   ├── use-mobile.tsx             # Hook de detecção mobile
│   └── use-toast.ts               # Hook do sistema de toast
├── lib/
│   └── utils.ts                   # Utilitários (cn helper)
└── test/                          # Testes automatizados
```

---

## 📊 Modelo de Dados

### `SaveData`
Representa um save do Modo Carreira com: nome, clube atual, temporada, histórico de clubes, elenco, transferências, troféus, orçamento, posição na liga, próximo jogo e estatísticas do time.

### `Player`
Jogador do elenco com: nome, posição (GOL/ZAG/MEI/ATA), idade, OVR, gols, assistências, valor de mercado, salário, cartões e status.

### `Transfer`
Transferência com: nome do jogador, tipo (compra/venda), clubes de origem e destino, valor e ano.

### `Trophy`
Troféu conquistado com: nome da competição, ano e clube.

### `ClubHistory`
Registro de passagem por um clube com: nome, período, partidas, vitórias, empates e derrotas.

---

## 🎨 Design

- **Dark mode** por padrão
- UI com estética **gamer/esportiva** com efeitos de glow e bordas estilizadas
- Paleta de cores com semântica: primary (destaque), accent (secundário), destructive (perigo/derrotas), warning (atenção/empates), gold (troféus)
- Totalmente responsivo com grid adaptativo
