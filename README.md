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
- **Posição na Liga** — posição atual do time
- **Artilheiro** — jogador com mais gols no elenco
- **Saldo** — balanço financeiro do clube
- **Troféus** — total de troféus conquistados
- **Próximo Jogo** — adversário e data da próxima partida
- **Temporada Atual** — vitórias, empates e derrotas
- **Top 5 Artilheiros** — ranking dos jogadores com mais gols

### 3. Elenco (Squad)
- Tabela completa de jogadores com **ordenação por coluna** (nome, posição, idade, OVR, gols, assistências, salário, valor de mercado)
- Badges de posição coloridos (GOL, ZAG, MEI, ATA)
- Destaque de OVR por faixa (≥83 primário, ≥80 accent)
- **CRUD de jogadores** — adicionar, editar e remover jogadores via modal
- Campos do jogador: nome, posição, idade, OVR, gols, assistências, salário, valor de mercado, cartões amarelos/vermelhos, status (Crucial / Important / Role / Sporadic / Promising)

### 4. Estatísticas da Temporada
- Cards resumo: **Gols Pró**, **Gols Contra**, **Posse de Bola**
- Rankings: **Top 5 Artilheiros**, **Top 5 Assistentes**, **Top 5 Cartões**
- Edição das estatísticas do time via modal

### 5. Transferências
- Duas abas: **Janela Atual** e **Histórico**
- Janela Atual: orçamento disponível, lista de contratações e vendas recentes
- Histórico: todas as transferências ordenadas por ano
- **CRUD de transferências** — adicionar, editar e remover via modal
- Campos: nome do jogador, tipo (compra/venda), clube de origem, clube de destino, valor, ano

### 6. História (Legado do Save)
- Estatísticas acumuladas: total de jogos, vitórias, empates e derrotas
- **Vitrine de troféus** conquistados
- **Clubes gerenciados** com período e retrospecto (V/E/D)
- **Recordes**: maior compra, maior venda, artilheiro histórico, assistente histórico

### 7. Mudar de Clube
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
| `PlayerModal` | `SquadScreen` | Adicionar/Editar jogador |
| `StatsModal` | `StatsScreen` | Editar estatísticas do time |
| `TransferModal` | `TransfersScreen` | Adicionar/Editar transferência |

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
