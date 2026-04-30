import type { Step } from "react-joyride";

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
