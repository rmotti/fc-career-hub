import type { Step } from "react-joyride";

const saveSelectTutorialSteps: Step[] = [
  {
    target: "[data-tour='save-header']",
    title: "Central das carreiras",
    content: "Esta é a tela principal para criar, abrir e administrar seus saves.",
    placement: "bottom",
    skipBeacon: true,
  },
  {
    target: "[data-tour='save-user-summary']",
    title: "Conta e limite",
    content: "Aqui você confere usuário, plano atual e quantos saves já foram criados.",
    placement: "bottom",
  },
  {
    target: "[data-tour='save-list']",
    title: "Saves existentes",
    content: "Abra uma carreira pelo card, ou use a lixeira para remover um save antigo.",
    placement: "top",
  },
  {
    target: "[data-tour='save-create-action']",
    title: "Criar carreira",
    content: "Comece um novo save informando nome, liga, clube inicial, orçamento e competição europeia opcional.",
    placement: "top",
  },
  {
    target: "[data-tour='save-form']",
    title: "Dados iniciais",
    content: "O formulário monta a base da carreira. Depois disso, você cai direto no dashboard do save.",
    placement: "center",
  },
  {
    target: "[data-tour='save-help']",
    title: "Ajuda sob demanda",
    content: "O botão de ajuda fica disponível para reabrir o tutorial quando precisar.",
    placement: "bottom",
  },
];

export { saveSelectTutorialSteps };
