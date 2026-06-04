# FC Career Hub — Documentation

Living documentation of the FC Career Hub product, generated from the current state of the repository (frontend + API). Each file is self-contained and ends with a verification footer pointing at the commit it was last reconciled against.

## Structure

### [01_Product](01_Product/)
- [1.1 Overview](01_Product/1.1_Overview.md) — what the product is, who it serves, and the value it delivers.
- [1.2 Roadmap](01_Product/1.2_Roadmap.md) — direction by horizon (consolidation, value expansion, intelligence).

### [02_Domain](02_Domain/)
- [2.1 Business Rules](02_Domain/2.1_Business_Rules.md) — domain rules extracted from code (Prisma schema, services, guards).

### [03_Technical](03_Technical/)
- [3.1 Architecture](03_Technical/3.1_Architecture.md) — frontend FSD layers, API request flow, integration topology.
- [3.2 Design System](03_Technical/3.2_Design_System.md) — tokens, palette, typography, customized shadcn components.
- [3.3 API and Integrations](03_Technical/3.3_API_and_Integrations.md) — endpoints, response envelopes, error contract, MCP server.
- [3.4 Code Standards](03_Technical/3.4_Code_Standards.md) — conventions, file organization, validation, testing.

### [03_Technical/Modules](03_Technical/Modules/)
One file per functional module, grouped by responsibility (not by file):

- [3.6.1 Auth](03_Technical/Modules/3.6.1_Auth.md)
- [3.6.2 Saves and Careers](03_Technical/Modules/3.6.2_Saves.md)
- [3.6.3 Squad](03_Technical/Modules/3.6.3_Squad.md)
- [3.6.4 Field Lineup](03_Technical/Modules/3.6.4_Field.md)
- [3.6.5 Transfers](03_Technical/Modules/3.6.5_Transfers.md)
- [3.6.6 Stats](03_Technical/Modules/3.6.6_Stats.md)
- [3.6.7 History](03_Technical/Modules/3.6.7_History.md)
- [3.6.8 Change Club and New Season](03_Technical/Modules/3.6.8_Change_Club_New_Season.md)
- [3.6.9 Scout](03_Technical/Modules/3.6.9_Scout.md)
- [3.6.10 Playbooks](03_Technical/Modules/3.6.10_Playbooks.md)
- [3.6.11 Dashboard](03_Technical/Modules/3.6.11_Dashboard.md)
- [3.6.12 Tutorial](03_Technical/Modules/3.6.12_Tutorial.md)

### Top-level
- [AI_RULES.md](AI_RULES.md) — operational rules for AI agents working in this repo.

## Recommended Reading Order

### For product / strategy
1. [1.1 Overview](01_Product/1.1_Overview.md)
2. [1.2 Roadmap](01_Product/1.2_Roadmap.md)

### For engineering
1. [AI_RULES.md](AI_RULES.md)
2. [3.1 Architecture](03_Technical/3.1_Architecture.md)
3. [3.3 API and Integrations](03_Technical/3.3_API_and_Integrations.md)
4. [3.4 Code Standards](03_Technical/3.4_Code_Standards.md)
5. [Modules](03_Technical/Modules/) — the one(s) you'll touch.

### For AI agents (first-touch)
1. [AI_RULES.md](AI_RULES.md) — always.
2. [3.1 Architecture](03_Technical/3.1_Architecture.md) for layout context.
3. The specific [Module](03_Technical/Modules/) doc for the area you're editing.

## Conventions

- Each technical doc ends with an **Auto-audit** section that distinguishes what is confirmed in code from what was inferred.
- The API repo is colocated at [`career-hub-api/`](career-hub-api/) for cross-referencing. It is **not** built or run from this directory.
- Routes referenced as `/api/...` are served by the API; routes like `/squad`, `/scout/ia` are React Router paths.
