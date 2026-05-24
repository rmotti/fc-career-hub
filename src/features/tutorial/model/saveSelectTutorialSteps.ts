import type { Step } from "react-joyride";

const saveSelectTutorialSteps: Step[] = [
  {
    target: "[data-tour='save-header']",
    title: "Career Hub",
    content: "This is the main screen to create, open and manage your saves.",
    placement: "bottom",
    skipBeacon: true,
  },
  {
    target: "[data-tour='save-user-summary']",
    title: "Account & limit",
    content: "Check your user, current plan and how many saves have been created.",
    placement: "bottom",
  },
  {
    target: "[data-tour='save-list']",
    title: "Existing saves",
    content: "Open a career via the card, or use the trash icon to remove an old save.",
    placement: "top",
  },
  {
    target: "[data-tour='save-create-action']",
    title: "Create career",
    content: "Start a new save by entering a name, league, starting club, budget and optional European competition.",
    placement: "top",
  },
  {
    target: "[data-tour='save-form']",
    title: "Initial data",
    content: "The form sets up the career base. After that, you go straight to the save dashboard.",
    placement: "center",
  },
  {
    target: "[data-tour='save-help']",
    title: "On-demand help",
    content: "The help button stays available to reopen the tutorial when needed.",
    placement: "bottom",
  },
];

export { saveSelectTutorialSteps };
