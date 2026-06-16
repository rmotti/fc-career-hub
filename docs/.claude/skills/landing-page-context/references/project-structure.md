# FC Career Hub: mapa do projeto para redesign de landing page

## 1. Resumo executivo

O projeto e um aplicativo web para jogadores de FC que querem registrar e acompanhar seus saves do Modo Carreira. O valor principal do produto hoje esta em organizar a jornada completa do save: clube atual, elenco, estatisticas, transferencias, trofeus e historico da carreira.

Do ponto de vista de conversao, o ponto mais importante e este:

- Hoje a rota `/` nao funciona como landing page publica.
- A home atual exige autenticacao, porque `Index.tsx` fica dentro de `ProtectedRoute`.
- Na pratica, a experiencia atual de entrada e mais parecida com "hub de saves" do que com "pagina de venda / captacao".

Isso significa que uma landing page realmente voltada para conversao provavelmente vai exigir separar:

- home publica;
- telas de autenticacao;
- app autenticado;
- possiveis CTAs de assinatura/upgrade.

## 2. Stack e arquitetura

### Frontend

- React 18 + TypeScript
- Vite 5
- React Router DOM v6
- TanStack React Query
- Tailwind CSS 3
- shadcn/ui + Radix UI
- Lucide React
- Sonner para toasts

### API

- Cliente HTTP manual em `src/services/api.ts`
- URL padrao: `https://ample-love-production.up.railway.app/api`
- Sessao baseada em token salvo no `localStorage`

### Testes

- Vitest + Testing Library
- Playwright configurado, mas a cobertura principal local parece estar em testes unitarios

## 3. Estrutura principal do codigo

### Entradas principais

- `src/main.tsx`: bootstrap da aplicacao
- `src/App.tsx`: providers globais e roteamento
- `src/index.css`: tokens globais, fontes e estilo base

### Paginas

- `src/pages/Index.tsx`: entrada autenticada do usuario; carrega e cria saves
- `src/pages/Login.tsx`: login
- `src/pages/Register.tsx`: cadastro
- `src/pages/HubLayout.tsx`: casca interna do produto autenticado
- `src/pages/hub/*`: telas do hub

### Componentes relevantes para onboarding e percepcao de valor

- `src/components/SaveSelect.tsx`: home atual do usuario logado
- `src/components/AuthPageLayout.tsx`: estrutura visual de login/cadastro
- `src/components/AuthHubShowcase.tsx`: bloco de apresentacao com beneficios e "como funciona"

### Dados e integracao

- `src/services/api.ts`: contratos do backend
- `src/contexts/AuthContext.tsx`: sessao do usuario
- `src/hooks/useSaves.ts` e hooks correlatos: consumo da API por dominio

## 4. Como o produto funciona hoje

Depois de autenticar, o usuario entra no fluxo abaixo:

1. Acessa `/`
2. Ve a tela de selecao/criacao de saves
3. Escolhe ou cria um save
4. E redirecionado para `/dashboard`
5. Usa o hub para gerenciar a carreira

As areas principais do hub sao:

- Dashboard
- Elenco
- Estatisticas
- Historia
- Transferencias
- Mudar de clube
- Campo

Isso mostra que o produto ja tem profundidade funcional suficiente para sustentar uma landing com narrativa forte. O desafio nao e falta de features; e falta de uma camada publica de marketing e conversao.

## 5. Ponto critico de roteamento

O roteamento atual em `src/App.tsx` funciona assim:

- `/login` e `/register` ficam em `PublicOnlyRoute`
- `/` fica em `ProtectedRoute`
- o restante do hub tambem fica protegido

Impacto para uma nova landing:

- Se a landing publica usar `/`, sera preciso mover a tela atual de selecao de save para outra rota protegida, como `/app`, `/hub` ou `/saves`.
- Se a landing continuar em outra rota, a conversao tende a ser pior do que usar `/` como entrada principal.
- Qualquer redesign de alta conversao deve considerar arquitetura de rotas, nao apenas visual.

## 6. O que a "landing" atual realmente e

`src/components/SaveSelect.tsx` tem elementos de hero e proposta de valor, mas o contexto e de produto logado:

- sauda o usuario por nome;
- mostra o plano atual;
- lista saves existentes;
- permite criar save imediatamente;
- termina com um rodape simples.

Conclusao:

- nao e uma landing publica;
- nao vende assinatura;
- nao tem prova social, precificacao, comparativo de planos, FAQ ou captacao de leads;
- serve bem como "dashboard inicial do usuario autenticado".

Ao redesenhar a landing, o ideal e nao destruir esse papel. Considere transformar `SaveSelect` em uma tela interna de onboarding/app, nao em pagina de marketing.

## 7. Proposta de valor do produto

Com base no README e nos componentes atuais, a mensagem central do produto e:

"Organize, acompanhe e preserve toda a sua jornada no modo carreira do FC em um unico hub."

Sub-beneficios reais ja suportados pelo produto:

- acompanhamento de multiplos saves;
- gestao de elenco com dados por jogador;
- controle de transferencias;
- historico de clubes e temporadas;
- sala de trofeus;
- estatisticas de time e atletas;
- continuidade entre temporadas.

Essa proposta pode sustentar CTAs como:

- criar conta gratis;
- comecar meu save;
- organizar minha carreira;
- testar o hub agora;
- desbloquear plano PRO.

## 8. Design system e linguagem visual ja existente

Em `src/index.css`, o produto usa uma identidade gamer escura:

- background escuro
- verde vibrante como `primary`
- ciano como `accent`
- tipografia com `Rajdhani` para titulos
- `Inter` para corpo
- cards com gradiente escuro
- brilho neon sutil em elementos importantes

Tokens percebidos:

- `primary`: verde neon
- `accent`: ciano
- `warning`: amarelo
- `gold`: dourado
- `destructive`: vermelho

Classes utilitarias importantes:

- `.card-gamer`
- `.glow-primary`
- `.glow-accent`
- `.text-glow-primary`
- `.stat-highlight`

Para a landing nova:

- preserve a identidade gamer/esportiva;
- eleve a ambicao visual;
- nao troque tudo por uma landing SaaS generica;
- mantenha coerencia com os tokens ja existentes, salvo se o redesign incluir revisao consciente do branding.

## 9. Conteudo de marketing ja existente

`src/components/AuthHubShowcase.tsx` ja traz um embriao de narrativa comercial:

- registre sua carreira;
- estatisticas completas;
- historico de trofeus;
- fluxo em 4 etapas explicando o uso.

Esse componente pode servir como:

- fonte de copy;
- ponto de reaproveitamento parcial;
- base para transformar benefcios em secoes mais sofisticadas.

Mas ele ainda e insuficiente para conversao premium, porque faltam:

- hero com CTA principal e CTA secundario;
- prova de valor imediata;
- visualizacao forte do produto;
- comparativo de planos;
- indicacao clara do que e gratis vs pago;
- FAQ e objecoes;
- secao final de fechamento.

## 10. Estado de monetizacao percebido

Ha sinal de monetizacao no dominio:

- `ApiUser.plan` pode ser `FREE`, `PRO` ou `PREMIUM`
- componentes exibem o plano do usuario

Mas no frontend atual, a monetizacao ainda nao parece explorada como experiencia de venda.

Para uma landing focada em assinaturas, um agente deve investigar e alinhar:

- se existem regras reais de limite por plano;
- se ja existe backend para upgrade;
- se a landing vai apenas captar interesse ou tambem vender/explicar planos;
- se ha necessidade de uma pagina especifica de pricing.

Sem essa verificacao, qualquer secao de precificacao pode virar apenas mock visual.

## 11. Arquivos que um agente de landing page deve ler primeiro

Ordem recomendada:

1. `src/App.tsx`
2. `src/pages/Index.tsx`
3. `src/components/SaveSelect.tsx`
4. `src/pages/Login.tsx`
5. `src/pages/Register.tsx`
6. `src/components/AuthHubShowcase.tsx`
7. `src/index.css`
8. `README.md`

Se for mexer no app logado:

9. `src/pages/HubLayout.tsx`
10. `src/components/hub/*`

## 12. Hipotese de arquitetura mais adequada para uma landing de conversao

Sem implementar nada automaticamente, a direcao mais coerente parece ser:

- `/` vira landing page publica
- `/login` e `/register` continuam publicas
- uma nova rota protegida, como `/app` ou `/saves`, passa a renderizar a tela atual de selecao de save
- `/dashboard` e demais rotas continuam protegidas

Beneficios:

- melhora a clareza entre marketing e produto
- facilita CTA direto para cadastro
- permite blocos de assinatura/pricing sem contaminar a UX interna
- evita usar a tela de save como pagina de venda

## 13. O que um agente especializado deve otimizar

Objetivo principal:

- aumentar conversao para cadastro e, se aplicavel, assinatura

Objetivos secundarios:

- deixar claro o que o produto faz em menos de 5 segundos
- mostrar por que o FC Career Hub e util para jogadores de Modo Carreira
- criar desejo visual sem perder legibilidade
- destacar continuidade, controle e historico como beneficios emocionais

## 14. Riscos de implementacao

- confundir landing publica com tela interna de save
- quebrar o fluxo autenticado atual ao alterar `/`
- prometer assinatura/premium sem suporte real do produto
- criar uma interface bonita, mas sem CTA claro
- perder a identidade gamer do projeto

## 15. Resumo final para o agente

O FC Career Hub ja tem um produto com profundidade funcional, identidade visual base e ganchos de monetizacao. O que falta e uma camada publica de marketing orientada a conversao. A maior decisao tecnica nao e apenas "como deixar a landing bonita", e sim "como separar landing publica e app autenticado sem quebrar o fluxo atual".

Se o objetivo for alta conversao, trate o redesign como combinacao de:

- nova narrativa comercial;
- nova home publica;
- ajuste de roteamento;
- CTAs de cadastro/assinatura;
- preservacao da experiencia interna do hub.
