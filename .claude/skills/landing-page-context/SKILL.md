---
name: landing-page-context
description: Resume a estrutura, o produto e os pontos críticos do projeto FC Career Hub. Use quando um agente precisar entender rapidamente o app antes de remodelar a landing page, criar uma home pública, revisar rotas de conversão, ou alinhar mensagens de marketing com a arquitetura existente.
---

# Landing Page Context

Leia `references/project-structure.md` antes de propor ou implementar mudanças visuais relevantes na landing page.

Use esta skill para:

- Entender o produto e o fluxo principal do usuário.
- Identificar quais arquivos afetam a home atual, autenticação e navegação.
- Evitar assumir que já existe uma landing pública separada do app autenticado.
- Planejar uma landing focada em conversão sem quebrar o hub interno.

Fluxo recomendado:

1. Ler `references/project-structure.md`.
2. Confirmar que hoje `/` é uma rota autenticada e não uma landing pública tradicional.
3. Localizar os pontos de entrada que provavelmente precisarão mudar: `src/App.tsx`, `src/pages/Index.tsx`, `src/components/SaveSelect.tsx`, `src/pages/Login.tsx` e `src/pages/Register.tsx`.
4. Preservar o posicionamento do produto: app para acompanhar saves de Modo Carreira do FC.
5. Priorizar CTA claro para cadastro/login/assinatura e separar marketing de experiência logada quando fizer sentido.

Ao trabalhar com essa skill, trate o documento de referência como fonte principal de contexto do projeto.
