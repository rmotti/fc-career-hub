# 04 Next Steps

Backlog de próximos passos do FC Career Hub, agora que o débito técnico mapeado no roadmap de hardening foi quitado. Cada candidato a trabalho é classificado em **um** dos quatro documentos abaixo pela sua natureza — não pelo módulo que toca.

O conteúdo de cada item é preenchido manualmente conforme análise. Estes arquivos definem a estrutura e o critério de classificação; entram aqui apenas itens já triados.

## Documentos

- [4.1 Correções](4.1_Corrections.md) — comportamento existente que está errado, quebrado ou divergente do esperado. Restaura o que já deveria funcionar.
- [4.2 Features](4.2_Features.md) — capacidade nova que o produto ainda não tem. Adiciona superfície.
- [4.3 Melhorias](4.3_Improvements.md) — algo que já funciona, mas pode ficar melhor (UX, performance, acessibilidade, DX, código). Não muda o que o produto faz.
- [4.4 Alterações de Regra de Negócio](4.4_Business_Rule_Changes.md) — mudança deliberada no domínio: como o produto decide, calcula ou restringe. Altera regras já documentadas em [2.1 Business Rules](../02_Domain/2.1_Business_Rules.md).

## Como classificar

Em ordem — pare na primeira que se aplica:

1. Muda uma **regra do domínio** (cálculo, restrição, decisão)? → **Alteração de Regra de Negócio**
2. É um **comportamento atual errado** que precisa voltar ao certo? → **Correção**
3. É uma **capacidade que não existe** hoje? → **Feature**
4. É um **refinamento** de algo que já existe e funciona? → **Melhoria**

> Uma feature pode exigir uma alteração de regra; nesse caso registre os dois itens e referencie um no outro com link relativo.

## Convenções

- **Status:** `- [ ]` não iniciado · `- [~]` em andamento · `- [x]` concluído.
- Itens herdados do roadmap de débito técnico (ex.: polish de UX/a11y, revival de e2e) entram aqui marcados como _carried-over_, com link para a origem.
- Cada documento mantém um rodapé de verificação por commit, como o restante de `docs/`.

## Plano de implementação progressivo

Sequência sugerida por **dependência e risco**, não só por impacto — cada fase agrupa itens coesos para que um modelo de dados seja decidido uma vez e a UI venha em cima. Triagem inicial; refine conforme sua análise. Itens marcados **discovery** precisam de discussão de produto antes de estimar.

| Fase | Tema | Itens | Resp. predominante |
|---|---|---|---|
| **A** ◐ | Polish & consistência (baixo risco, FE-only) — _em andamento_ | [C-03](4.1_Corrections.md) · ✅ [M-01](4.3_Improvements.md) · [M-02](4.3_Improvements.md) · [M-04](4.3_Improvements.md) · Task 15 (a11y, carried-over) | Frontend |
| **B** ✅ | Cluster Empréstimos (defeitos + regras de domínio) — _concluída_ | [R-01](4.4_Business_Rule_Changes.md) → [C-01](4.1_Corrections.md) · [C-02](4.1_Corrections.md) → [F-02](4.2_Features.md) → [R-02](4.4_Business_Rule_Changes.md) | Ambos |
| **C** ◐ | Persistência & dados (server-side, custo) — _em andamento_ | ✅ [M-09](4.3_Improvements.md) · ✅ [F-03](4.2_Features.md) · [M-08](4.3_Improvements.md) → [F-05](4.2_Features.md) | API + FE |
| **D** | Scout & assistente (**discovery** primeiro) | [M-07](4.3_Improvements.md) · [M-06](4.3_Improvements.md) | Ambos |
| **E** | Expansão de produto / reach | [F-01](4.2_Features.md) · [M-05](4.3_Improvements.md) · [M-03](4.3_Improvements.md) · [F-04](4.2_Features.md) (trilha própria) | Ambos |

Notas de sequenciamento:

- **Fase A** destrava confiança rápido, sem tocar a API — bom aquecimento e baixa superfície de risco.
- **Fase B** é um bloco coeso: defina o modelo de stats por contexto ([R-01](4.4_Business_Rule_Changes.md)) **antes** de consertar idade/edição, porque recall ([F-02](4.2_Features.md)) e empréstimo de 2 temporadas ([R-02](4.4_Business_Rule_Changes.md)) dependem desse modelo e do rollover.
- **Fase C**: [M-09](4.3_Improvements.md) (saved queries + shortlist server-side) e [F-03](4.2_Features.md) (histórico de chat persistido) **concluídos**. Resta o par [M-08](4.3_Improvements.md) (retenção/arquivamento) → [F-05](4.2_Features.md): o M-08 define como o histórico é guardado e o F-05 (histórico por temporada no Squad) consome esse histórico — decidir retenção antes de expor a UI.
- **Fase D** não deve ser estimada antes da rediscussão de funcionalidades do Scout e da persona.
- **Fase E** é net-new surface; [F-04](4.2_Features.md) (pagamento) pode rodar como trilha paralela independente.

### Split Frontend × API (resumo)

- **Só Frontend**: [C-03](4.1_Corrections.md), [M-01](4.3_Improvements.md), [M-02](4.3_Improvements.md), [M-03](4.3_Improvements.md), [M-04](4.3_Improvements.md), [M-09](4.3_Improvements.md) (clients prontos).
- **Predominante API**: [C-01](4.1_Corrections.md) (rollover idade), [M-06](4.3_Improvements.md) (persona), [M-08](4.3_Improvements.md) (arquivamento/custo).
- **Ambos (contrato FE↔API novo)**: [C-02](4.1_Corrections.md), [R-01](4.4_Business_Rule_Changes.md), [R-02](4.4_Business_Rule_Changes.md), [F-01](4.2_Features.md), [F-02](4.2_Features.md), [F-03](4.2_Features.md), [F-04](4.2_Features.md), [F-05](4.2_Features.md), [M-05](4.3_Improvements.md), [M-07](4.3_Improvements.md).

> Esta divisão é a crença inicial a partir da leitura do FE; alguns itens marcados _a confirmar_ dependem de checar o repositório da API.

_Last verified against commit `25ed8f4`._
