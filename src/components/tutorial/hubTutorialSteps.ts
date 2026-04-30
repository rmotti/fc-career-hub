import type { Step } from "react-joyride";

const isVisibleElement = (element: Element) => {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0"
  );
};

const getVisibleElement = (selector: string) =>
  Array.from(document.querySelectorAll(selector)).find(isVisibleElement) as HTMLElement | undefined;

const waitForVisibleTarget = async (selector: string) => {
  const startedAt = Date.now();

  await new Promise<void>((resolve) => {
    const check = () => {
      if (getVisibleElement(selector) || Date.now() - startedAt > 1800) {
        resolve();
        return;
      }

      window.setTimeout(check, 50);
    };

    check();
  });
};

const waitForTarget = (selector: string): NonNullable<Step["before"]> => async () => {
  await waitForVisibleTarget(selector);
};

const openTargetBeforeStep = (triggerSelector: string, targetSelector: string): NonNullable<Step["before"]> => async () => {
  if (!getVisibleElement(targetSelector)) {
    getVisibleElement(triggerSelector)?.click();
  }

  await waitForVisibleTarget(targetSelector);
};

const clickAfterNext = (selector: string): NonNullable<Step["after"]> => ({ action }) => {
  if (action !== "next") return;

  getVisibleElement(selector)?.click();
};

const globalSteps: Step[] = [
  {
    target: "[data-tour='hub-navigation']",
    title: "Navegação principal",
    content: "Use o menu para alternar entre visão geral, elenco, escalação, transferências, estatísticas e história.",
    placement: "right",
    skipBeacon: true,
  },
];

const dashboardSteps: Step[] = [
  {
    target: "[data-tour='dashboard-overview']",
    title: "Painel da temporada",
    content: "Aqui fica o resumo vivo da carreira: campanha, protagonistas, finanças, mercado e legado.",
    placement: "bottom",
  },
  {
    target: "[data-tour='dashboard-finance']",
    title: "Saúde financeira",
    content: "Acompanhe orçamento, saldo disponível e alertas para manter o save sob controle.",
    placement: "top",
  },
];

const squadSteps: Step[] = [
  {
    target: "[data-tour='squad-header']",
    title: "Central do elenco",
    content: "Gerencie jogadores, estatísticas individuais, evolução, valor de mercado e dados de contrato.",
    placement: "bottom",
  },
  {
    target: "[data-tour='squad-create-player']",
    title: "Criar jogador",
    content: "Este botão inicia o cadastro de um atleta. Ao avançar, o sistema abre o modal automaticamente para mostrar o fluxo sem você precisar clicar.",
    placement: "bottom",
  },
  {
    target: "[data-tour='player-modal']",
    title: "Cadastro aberto",
    content: "Aqui fica o formulário do jogador. Ele reúne identidade, desenvolvimento, números da temporada e dados de mercado no mesmo modal.",
    placement: "center",
    before: openTargetBeforeStep("[data-tour='squad-create-player']", "[data-tour='player-modal']"),
    data: {
      keepWhenMissingTarget: "[data-tour='squad-create-player']",
    },
  },
  {
    target: "[data-tour='player-modal-identity']",
    title: "Identidade do atleta",
    content: "Comece por nome, país, posição, status no elenco, idade e camisa. Esses dados definem como o jogador aparece nas telas e filtros.",
    placement: "bottom",
    before: waitForTarget("[data-tour='player-modal-identity']"),
    data: {
      keepWhenMissingTarget: "[data-tour='squad-create-player']",
    },
  },
  {
    target: "[data-tour='player-modal-stats']",
    title: "Estatísticas iniciais",
    content: "Aqui você pode registrar partidas, gols, assistências, cartões e clean sheets. Esses números alimentam os rankings e destaques do save.",
    placement: "top",
    before: waitForTarget("[data-tour='player-modal-stats']"),
    data: {
      keepWhenMissingTarget: "[data-tour='squad-create-player']",
    },
  },
  {
    target: "[data-tour='player-modal-market']",
    title: "Mercado e contrato",
    content: "Use salário e valor de mercado para manter a parte financeira do elenco atualizada.",
    placement: "top",
    before: waitForTarget("[data-tour='player-modal-market']"),
    data: {
      keepWhenMissingTarget: "[data-tour='squad-create-player']",
    },
  },
  {
    target: "[data-tour='player-modal-cancel']",
    title: "Fechar sem salvar",
    content: "No tutorial, vamos fechar o modal sem cadastrar ninguém. Em uso real, preencha os campos e finalize em Adicionar jogador.",
    placement: "top",
    before: waitForTarget("[data-tour='player-modal-cancel']"),
    after: clickAfterNext("[data-tour='player-modal-cancel']"),
    data: {
      keepWhenMissingTarget: "[data-tour='squad-create-player']",
    },
  },
  {
    target: "[data-tour='squad-metrics']",
    title: "Resumo do grupo",
    content: "Estes cartões condensam idade média, OVR, produção ofensiva e valor total do elenco.",
    placement: "bottom",
  },
  {
    target: "[data-tour='squad-controls']",
    title: "Modos e filtros",
    content: "Alterne a visão da tabela, filtre setores e busque jogadores rapidamente.",
    placement: "bottom",
  },
  {
    target: "[data-tour='squad-table']",
    title: "Tabela do elenco",
    content: "Clique nos cabeçalhos para ordenar e use as ações da linha para ver detalhes, editar ou dispensar.",
    placement: "top",
  },
  {
    target: "[data-tour='squad-edit-player']",
    title: "Editar e atualizar jogador",
    content: "Este botão abre o cadastro do jogador selecionado já preenchido. Ao avançar, o sistema abre o modal de edição automaticamente.",
    placement: "left",
  },
  {
    target: "[data-tour='player-modal']",
    title: "Modal de edição",
    content: "Na edição, os campos vêm preenchidos com os dados atuais do atleta. Você ajusta o que mudou e salva as alterações.",
    placement: "center",
    before: openTargetBeforeStep("[data-tour='squad-edit-player']", "[data-tour='player-modal']"),
    data: {
      keepWhenMissingTarget: "[data-tour='squad-edit-player']",
    },
  },
  {
    target: "[data-tour='player-modal-development']",
    title: "Atualizar evolução",
    content: "OVR e potencial são atualizados aqui. Use isso para registrar evolução, queda de desempenho ou ajuste de expectativa.",
    placement: "bottom",
    before: waitForTarget("[data-tour='player-modal-development']"),
    data: {
      keepWhenMissingTarget: "[data-tour='squad-edit-player']",
    },
  },
  {
    target: "[data-tour='player-modal-save']",
    title: "Salvar alterações",
    content: "Em uso real, este botão grava as mudanças e recalcula métricas do elenco. No tutorial, vamos fechar sem salvar para não alterar seus dados.",
    placement: "top",
    before: waitForTarget("[data-tour='player-modal-save']"),
    data: {
      keepWhenMissingTarget: "[data-tour='squad-edit-player']",
    },
  },
  {
    target: "[data-tour='player-modal-cancel']",
    title: "Voltar ao elenco",
    content: "Fechando o modal, você retorna à tabela do elenco e pode continuar gerenciando outros atletas.",
    placement: "top",
    before: waitForTarget("[data-tour='player-modal-cancel']"),
    after: clickAfterNext("[data-tour='player-modal-cancel']"),
    data: {
      keepWhenMissingTarget: "[data-tour='squad-edit-player']",
    },
  },
];

const fieldSteps: Step[] = [
  {
    target: "[data-tour='field-header']",
    title: "Controle da escalação",
    content: "Escolha a formação, limpe a escalação e organize titulares, banco e disponíveis.",
    placement: "bottom",
  },
  {
    target: "[data-tour='field-pitch']",
    title: "Campo tático",
    content: "Arraste jogadores para os slots, ajuste posições e acompanhe alertas de encaixe por posição.",
    placement: "right",
  },
  {
    target: "[data-tour='field-bench']",
    title: "Banco de reservas",
    content: "Monte os 11 reservas principais para simular a lista da partida.",
    placement: "right",
  },
  {
    target: "[data-tour='field-reserves']",
    title: "Jogadores disponíveis",
    content: "Busque e filtre atletas que ainda não estão alocados na escalação.",
    placement: "left",
  },
];

const transferSteps: Step[] = [
  {
    target: "[data-tour='transfers-header']",
    title: "Central de mercado",
    content: "Registre compras, vendas e empréstimos, ou consulte o histórico completo.",
    placement: "bottom",
  },
  {
    target: "[data-tour='transfers-create-transfer']",
    title: "Nova transferência",
    content: "Este botão registra compras, vendas e empréstimos. Ao avançar, o sistema abre o modal automaticamente para mostrar o fluxo.",
    placement: "bottom",
  },
  {
    target: "[data-tour='transfer-modal']",
    title: "Registro de transferência",
    content: "O modal concentra jogador, tipo de movimento, valor, temporada e clubes envolvidos.",
    placement: "center",
    before: openTargetBeforeStep("[data-tour='transfers-create-transfer']", "[data-tour='transfer-modal']"),
    data: {
      keepWhenMissingTarget: "[data-tour='transfers-create-transfer']",
    },
  },
  {
    target: "[data-tour='transfer-modal-player']",
    title: "Tipo e jogador",
    content: "Escolha se é compra, venda ou empréstimo. Em saídas, você seleciona um atleta do elenco; em entradas, informa o nome do novo jogador.",
    placement: "bottom",
    before: waitForTarget("[data-tour='transfer-modal-player']"),
    data: {
      keepWhenMissingTarget: "[data-tour='transfers-create-transfer']",
    },
  },
  {
    target: "[data-tour='transfer-modal-clubs']",
    title: "Origem e destino",
    content: "O clube atual fica travado no lado correto da operação. Você completa o outro clube para registrar a rota da negociação.",
    placement: "top",
    before: waitForTarget("[data-tour='transfer-modal-clubs']"),
    data: {
      keepWhenMissingTarget: "[data-tour='transfers-create-transfer']",
    },
  },
  {
    target: "[data-tour='transfer-modal-cancel']",
    title: "Fechar sem registrar",
    content: "No tutorial, vamos fechar sem salvar. Na rotina normal, use Registrar transferência para gravar a movimentação.",
    placement: "top",
    before: waitForTarget("[data-tour='transfer-modal-cancel']"),
    after: clickAfterNext("[data-tour='transfer-modal-cancel']"),
    data: {
      keepWhenMissingTarget: "[data-tour='transfers-create-transfer']",
    },
  },
  {
    target: "[data-tour='transfers-metrics']",
    title: "Leitura financeira",
    content: "Veja saldo, resultado da janela, entradas e saídas do clube na temporada.",
    placement: "bottom",
  },
  {
    target: "[data-tour='transfers-current']",
    title: "Janela atual",
    content: "As movimentações são separadas por entradas e saídas para facilitar a leitura.",
    placement: "top",
  },
  {
    target: "[data-tour='transfers-edit-transfer']",
    title: "Editar transferência",
    content: "O lápis abre uma movimentação existente para correção. Ao avançar, o sistema abre o modal de edição automaticamente.",
    placement: "left",
  },
  {
    target: "[data-tour='transfer-modal']",
    title: "Editar movimento",
    content: "Na edição, revise tipo, atleta, valor e clubes. Ao salvar, a janela e o histórico refletem a atualização.",
    placement: "center",
    before: openTargetBeforeStep("[data-tour='transfers-edit-transfer']", "[data-tour='transfer-modal']"),
    data: {
      keepWhenMissingTarget: "[data-tour='transfers-edit-transfer']",
    },
  },
  {
    target: "[data-tour='transfer-modal-save']",
    title: "Salvar correção",
    content: "Este botão grava a correção da transferência. Para preservar seus dados durante o tutorial, vamos fechar sem salvar na próxima etapa.",
    placement: "top",
    before: waitForTarget("[data-tour='transfer-modal-save']"),
    data: {
      keepWhenMissingTarget: "[data-tour='transfers-edit-transfer']",
    },
  },
  {
    target: "[data-tour='transfer-modal-cancel']",
    title: "Voltar ao mercado",
    content: "Fechando o modal, você volta para a central de mercado.",
    placement: "top",
    before: waitForTarget("[data-tour='transfer-modal-cancel']"),
    after: clickAfterNext("[data-tour='transfer-modal-cancel']"),
    data: {
      keepWhenMissingTarget: "[data-tour='transfers-edit-transfer']",
    },
  },
  {
    target: "[data-tour='transfers-history']",
    title: "Histórico",
    content: "Ao abrir a aba histórico, estes filtros ajudam a cruzar tipo, temporada e valor.",
    placement: "top",
  },
];

const statsSteps: Step[] = [
  {
    target: "[data-tour='stats-header']",
    title: "Estatísticas da temporada",
    content: "Use esta tela para acompanhar campanha, competições e rankings individuais.",
    placement: "bottom",
  },
  {
    target: "[data-tour='hub-season-selector']",
    title: "Filtro de temporada",
    content: "Aqui você alterna entre temporadas disponíveis para comparar campanhas passadas.",
    placement: "bottom",
  },
  {
    target: "[data-tour='stats-campaign']",
    title: "Resumo da campanha",
    content: "Vitórias, empates, derrotas, aproveitamento e protagonista ficam concentrados neste bloco.",
    placement: "bottom",
  },
  {
    target: "[data-tour='stats-competition-card']",
    title: "Estatísticas por competição",
    content: "Cada card representa uma competição da temporada, com campanha, gols, saldo e resultado. É aqui que você mantém o registro oficial do desempenho do clube.",
    placement: "bottom",
  },
  {
    target: "[data-tour='stats-edit-competition']",
    title: "Editar estatísticas",
    content: "O lápis abre a edição da competição. Ao avançar, o sistema abre o modal automaticamente para mostrar quais campos atualizam a temporada.",
    placement: "left",
  },
  {
    target: "[data-tour='stats-modal']",
    title: "Edição da competição",
    content: "Este modal atualiza o desempenho do clube naquela competição: campanha, gols e resultado final.",
    placement: "center",
    before: openTargetBeforeStep("[data-tour='stats-edit-competition']", "[data-tour='stats-modal']"),
    data: {
      keepWhenMissingTarget: "[data-tour='stats-edit-competition']",
    },
  },
  {
    target: "[data-tour='stats-modal-campaign']",
    title: "Campanha",
    content: "Atualize vitórias, empates e derrotas. O app recalcula jogos, pontos e aproveitamento automaticamente.",
    placement: "bottom",
    before: waitForTarget("[data-tour='stats-modal-campaign']"),
    data: {
      keepWhenMissingTarget: "[data-tour='stats-edit-competition']",
    },
  },
  {
    target: "[data-tour='stats-modal-goals']",
    title: "Gols e saldo",
    content: "Registre gols marcados e sofridos. Esses valores alimentam saldo, média de gols e leitura da campanha.",
    placement: "top",
    before: waitForTarget("[data-tour='stats-modal-goals']"),
    data: {
      keepWhenMissingTarget: "[data-tour='stats-edit-competition']",
    },
  },
  {
    target: "[data-tour='stats-modal-result']",
    title: "Resultado final",
    content: "Em ligas, informe a posição; em copas, selecione a fase atingida ou título conquistado.",
    placement: "top",
    before: waitForTarget("[data-tour='stats-modal-result']"),
    data: {
      keepWhenMissingTarget: "[data-tour='stats-edit-competition']",
    },
  },
  {
    target: "[data-tour='stats-modal-cancel']",
    title: "Fechar sem alterar",
    content: "No tutorial, vamos fechar sem salvar. Quando estiver atualizando de verdade, use Salvar estatísticas.",
    placement: "top",
    before: waitForTarget("[data-tour='stats-modal-cancel']"),
    after: clickAfterNext("[data-tour='stats-modal-cancel']"),
    data: {
      keepWhenMissingTarget: "[data-tour='stats-edit-competition']",
    },
  },
  {
    target: "[data-tour='stats-rankings']",
    title: "Rankings individuais",
    content: "Alterne entre artilharia, assistências, uso e contribuições para ver os destaques.",
    placement: "top",
  },
];

const historySteps: Step[] = [
  {
    target: "[data-tour='history-hero']",
    title: "História da carreira",
    content: "A visão histórica resume legado, títulos, clubes e melhores campanhas do save.",
    placement: "bottom",
  },
  {
    target: "[data-tour='history-clubs']",
    title: "Clubes gerenciados",
    content: "Acompanhe sua trajetória por clube, temporadas e períodos de comando.",
    placement: "right",
  },
  {
    target: "[data-tour='history-trophies']",
    title: "Vitrine de títulos",
    content: "Todos os troféus registrados ficam organizados aqui para consulta rápida.",
    placement: "left",
  },
];

const changeClubSteps: Step[] = [
  {
    target: "[data-tour='change-club-hero']",
    title: "Mudança de clube",
    content: "Compare o clube atual com o próximo destino antes de assinar contrato.",
    placement: "bottom",
  },
  {
    target: "[data-tour='change-club-filters']",
    title: "Busca e filtros",
    content: "Filtre por liga ou pesquise para encontrar rapidamente o próximo projeto.",
    placement: "bottom",
  },
  {
    target: "[data-tour='change-club-list']",
    title: "Lista de clubes",
    content: "Escolha um clube para abrir a proposta e definir orçamento e competição inicial.",
    placement: "top",
  },
];

const routeSteps: Record<string, Step[]> = {
  "/dashboard": dashboardSteps,
  "/squad": squadSteps,
  "/field": fieldSteps,
  "/transfers": transferSteps,
  "/stats": statsSteps,
  "/history": historySteps,
  "/change-club": changeClubSteps,
};

const getHubTutorialSteps = (pathname: string): Step[] => [
  ...globalSteps,
  ...(routeSteps[pathname] ?? dashboardSteps),
  {
    target: "[data-tour='hub-new-season']",
    title: "Avançar temporada",
    content: "Quando fechar o ano, use este atalho para iniciar a próxima temporada com novo orçamento.",
    placement: "right",
  },
  {
    target: "[data-tour='hub-help']",
    title: "Tutorial sempre disponível",
    content: "Mesmo pulando o convite inicial, este botão continua nas telas para reabrir o tutorial.",
    placement: "bottom",
  },
];

export { getHubTutorialSteps };
