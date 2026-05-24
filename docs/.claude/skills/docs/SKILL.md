---
name: docs-frontend
description: Gera ou atualiza o README.md do repositório frontend. Use esta skill quando o usuário pedir para documentar o projeto, gerar ou atualizar o README, ou colar código do frontend para ser documentado. Também deve ser executada automaticamente após commits que alterem a estrutura do projeto. Triggers: "documenta o projeto", "gera o README", "atualiza a documentação", ou quando o usuário colar código de componentes, páginas, hooks ou serviços frontend.
---

# Docs — Frontend

Gera ou atualiza o `README.md` na raiz do repositório frontend a partir do código-fonte fornecido.

## Regras

- **Sem placeholders**: nunca use `[descreva aqui]`, `TODO` ou campos vazios. Se uma informação não estiver no código, infira pelo contexto ou omita a seção.
- **Informações reais**: nomes de páginas, rotas, componentes, hooks, variáveis de ambiente — tudo extraído do código fornecido.
- **Idioma**: seguir o idioma predominante do projeto.
- **Badges**: incluir badges do shields.io conforme a stack detectada (React, Vue, Next.js, TypeScript, Vite, Tailwind, etc.).

## Template

Leia `references/frontend-template.md` e preencha com as informações reais do projeto.

## Saída

- Nome do arquivo: `README.md`
- Salvar em `/mnt/user-data/outputs/`
- Apresentar via `present_files`