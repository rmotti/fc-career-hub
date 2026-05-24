---
name: fsd-refactor
description: Refatora projetos React/TypeScript para Feature-Sliced Design (FSD). Use esta skill sempre que o usuário mencionar reorganizar, refatorar ou migrar a estrutura de pastas de um projeto frontend React, especialmente quando a estrutura atual for por tipo de arquivo (components/, hooks/, services/, etc.). Também use quando o usuário pedir ajuda para escalar a arquitetura de um projeto React/TSX que está crescendo e ficando difícil de manter. Inclui mapa completo de onde cada arquivo deve ir, regras de importação, convenções de nomenclatura e exemplos práticos.
---

# FSD Refactor — Feature-Sliced Design para React/TypeScript

Esta skill guia a refatoração de projetos React/TSX de uma estrutura por tipo de arquivo para Feature-Sliced Design (FSD). O FSD organiza o código por **domínio de negócio**, não por tipo técnico.

Antes de gerar qualquer código ou plano de migração, leia:
- `references/fsd-layers.md` — camadas, regras de importação e onde cada coisa vai
- `references/migration-map.md` — mapa de migração arquivo a arquivo com exemplos
- `references/examples.md` — exemplos reais de código antes/depois

---

## Fluxo de trabalho

### 1. Diagnóstico

Peça ao usuário a estrutura atual de pastas (print do VSCode ou `tree src/`). Identifique:
- Quantas features distintas existem (auth, checkout, dashboard, etc.)
- O que está em `components/` que é genérico vs. específico de uma feature
- Se há estado global (Context, Redux, Zustand) e a que features ele pertence
- Rotas e páginas existentes

### 2. Mapeamento

Com base no diagnóstico, produza um **mapa de migração** no formato:

```
ANTES                              DEPOIS
src/components/LoginForm.tsx    →  src/features/auth/ui/LoginForm.tsx
src/hooks/useAuth.ts            →  src/features/auth/model/useAuth.ts
src/services/authService.ts     →  src/features/auth/api/authService.ts
src/contexts/AuthContext.tsx    →  src/features/auth/model/AuthContext.tsx
src/components/Button.tsx       →  src/shared/ui/Button.tsx
src/utils/formatDate.ts         →  src/shared/lib/formatDate.ts
src/pages/LoginPage.tsx         →  src/pages/LoginPage.tsx  (permanece)
```

Leia `references/migration-map.md` para o mapa completo por tipo de arquivo.

### 3. Estrutura alvo

Gere a estrutura de pastas completa do projeto após a migração. Leia `references/fsd-layers.md` para as regras de cada camada.

### 4. Execução

Para cada feature, gere:
1. A estrutura de pastas da feature com `index.ts` (public API)
2. Os arquivos migrados com imports corrigidos
3. O `index.ts` de cada segmento que exporta apenas o que é público

Leia `references/examples.md` para ver exemplos reais de código.

### 5. Checklist de validação

Após a migração, valide:
- [ ] Nenhuma feature importa diretamente de outra feature (apenas via `index.ts`)
- [ ] Camadas superiores não são importadas por camadas inferiores
- [ ] `shared/` não importa de nenhuma feature
- [ ] Cada feature tem um `index.ts` que é a única porta de entrada
- [ ] `pages/` só importa de `widgets/`, `features/` e `shared/`

---

## Regra de ouro

Se um arquivo serve a **uma feature específica**, ele mora dentro dessa feature. Se serve a **duas ou mais features**, ele vai para `shared/`. Se orquestra features numa tela, vai para `pages/` ou `widgets/`.