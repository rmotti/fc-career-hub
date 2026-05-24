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
    title: "Main navigation",
    content: "Use the menu to switch between overview, squad, lineup, transfers, stats and history.",
    placement: "right",
    skipBeacon: true,
  },
];

const dashboardSteps: Step[] = [
  {
    target: "[data-tour='dashboard-overview']",
    title: "Season panel",
    content: "Here you'll find the live career summary: campaign, key players, finances, market and legacy.",
    placement: "bottom",
  },
  {
    target: "[data-tour='dashboard-finance']",
    title: "Financial health",
    content: "Track budget, available balance and alerts to keep the save under control.",
    placement: "top",
  },
];

const squadSteps: Step[] = [
  {
    target: "[data-tour='squad-header']",
    title: "Squad hub",
    content: "Manage players, individual stats, development, market value and contract data.",
    placement: "bottom",
  },
  {
    target: "[data-tour='squad-create-player']",
    title: "Create player",
    content: "This button starts the player registration. On advance, the system opens the modal automatically to show the flow without needing to click.",
    placement: "bottom",
  },
  {
    target: "[data-tour='player-modal']",
    title: "Form open",
    content: "Here is the player form. It brings together identity, development, season stats and market data in the same modal.",
    placement: "center",
    before: openTargetBeforeStep("[data-tour='squad-create-player']", "[data-tour='player-modal']"),
    data: {
      keepWhenMissingTarget: "[data-tour='squad-create-player']",
    },
  },
  {
    target: "[data-tour='player-modal-identity']",
    title: "Player identity",
    content: "Start with name, country, position, squad status, age and shirt number. These define how the player appears in screens and filters.",
    placement: "bottom",
    before: waitForTarget("[data-tour='player-modal-identity']"),
    data: {
      keepWhenMissingTarget: "[data-tour='squad-create-player']",
    },
  },
  {
    target: "[data-tour='player-modal-stats']",
    title: "Initial stats",
    content: "Here you can record appearances, goals, assists, cards and clean sheets. These numbers feed the save's rankings and highlights.",
    placement: "top",
    before: waitForTarget("[data-tour='player-modal-stats']"),
    data: {
      keepWhenMissingTarget: "[data-tour='squad-create-player']",
    },
  },
  {
    target: "[data-tour='player-modal-market']",
    title: "Market & contract",
    content: "Use salary and market value to keep the squad's financial side up to date.",
    placement: "top",
    before: waitForTarget("[data-tour='player-modal-market']"),
    data: {
      keepWhenMissingTarget: "[data-tour='squad-create-player']",
    },
  },
  {
    target: "[data-tour='player-modal-cancel']",
    title: "Close without saving",
    content: "In the tutorial, we'll close the modal without registering anyone. In real use, fill in the fields and finish with Add player.",
    placement: "top",
    before: waitForTarget("[data-tour='player-modal-cancel']"),
    after: clickAfterNext("[data-tour='player-modal-cancel']"),
    data: {
      keepWhenMissingTarget: "[data-tour='squad-create-player']",
    },
  },
  {
    target: "[data-tour='squad-metrics']",
    title: "Squad summary",
    content: "These cards summarise average age, OVR, offensive output and total squad value.",
    placement: "bottom",
  },
  {
    target: "[data-tour='squad-controls']",
    title: "Views & filters",
    content: "Switch the table view, filter by sector and quickly search for players.",
    placement: "bottom",
  },
  {
    target: "[data-tour='squad-table']",
    title: "Squad table",
    content: "Click the headers to sort and use row actions to view details, edit or release.",
    placement: "top",
  },
  {
    target: "[data-tour='squad-edit-player']",
    title: "Edit & update player",
    content: "This button opens the selected player's form pre-filled. On advance, the system opens the edit modal automatically.",
    placement: "left",
  },
  {
    target: "[data-tour='player-modal']",
    title: "Edit modal",
    content: "In edit mode, fields come pre-filled with the player's current data. Adjust what changed and save.",
    placement: "center",
    before: openTargetBeforeStep("[data-tour='squad-edit-player']", "[data-tour='player-modal']"),
    data: {
      keepWhenMissingTarget: "[data-tour='squad-edit-player']",
    },
  },
  {
    target: "[data-tour='player-modal-development']",
    title: "Update development",
    content: "OVR and potential are updated here. Use this to record growth, performance drops or expectation adjustments.",
    placement: "bottom",
    before: waitForTarget("[data-tour='player-modal-development']"),
    data: {
      keepWhenMissingTarget: "[data-tour='squad-edit-player']",
    },
  },
  {
    target: "[data-tour='player-modal-save']",
    title: "Save changes",
    content: "In real use, this button saves changes and recalculates squad metrics. In the tutorial, we'll close without saving to preserve your data.",
    placement: "top",
    before: waitForTarget("[data-tour='player-modal-save']"),
    data: {
      keepWhenMissingTarget: "[data-tour='squad-edit-player']",
    },
  },
  {
    target: "[data-tour='player-modal-cancel']",
    title: "Back to squad",
    content: "Closing the modal returns you to the squad table to continue managing other players.",
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
    title: "Lineup control",
    content: "Choose the formation, clear the lineup and organise starters, bench and available players.",
    placement: "bottom",
  },
  {
    target: "[data-tour='field-pitch']",
    title: "Tactical pitch",
    content: "Drag players into slots, adjust positions and track position-fit alerts.",
    placement: "right",
  },
  {
    target: "[data-tour='field-bench']",
    title: "Bench",
    content: "Set up the 11 main substitutes to simulate the match-day list.",
    placement: "right",
  },
  {
    target: "[data-tour='field-reserves']",
    title: "Available players",
    content: "Search and filter players not yet assigned to the lineup.",
    placement: "left",
  },
];

const transferSteps: Step[] = [
  {
    target: "[data-tour='transfers-header']",
    title: "Transfer hub",
    content: "Register purchases, sales and loans, or view the full history.",
    placement: "bottom",
  },
  {
    target: "[data-tour='transfers-create-transfer']",
    title: "New transfer",
    content: "This button registers purchases, sales and loans. On advance, the system opens the modal automatically to show the flow.",
    placement: "bottom",
  },
  {
    target: "[data-tour='transfer-modal']",
    title: "Transfer record",
    content: "The modal brings together player, movement type, fee, season and clubs involved.",
    placement: "center",
    before: openTargetBeforeStep("[data-tour='transfers-create-transfer']", "[data-tour='transfer-modal']"),
    data: {
      keepWhenMissingTarget: "[data-tour='transfers-create-transfer']",
    },
  },
  {
    target: "[data-tour='transfer-modal-player']",
    title: "Type & player",
    content: "Choose purchase, sale or loan. For outgoing, select a squad player; for incoming, enter the new player's name.",
    placement: "bottom",
    before: waitForTarget("[data-tour='transfer-modal-player']"),
    data: {
      keepWhenMissingTarget: "[data-tour='transfers-create-transfer']",
    },
  },
  {
    target: "[data-tour='transfer-modal-clubs']",
    title: "Origin & destination",
    content: "The current club is locked on the correct side of the operation. You fill in the other club to record the transfer route.",
    placement: "top",
    before: waitForTarget("[data-tour='transfer-modal-clubs']"),
    data: {
      keepWhenMissingTarget: "[data-tour='transfers-create-transfer']",
    },
  },
  {
    target: "[data-tour='transfer-modal-cancel']",
    title: "Close without registering",
    content: "In the tutorial, we'll close without saving. In normal use, click Register transfer to save the movement.",
    placement: "top",
    before: waitForTarget("[data-tour='transfer-modal-cancel']"),
    after: clickAfterNext("[data-tour='transfer-modal-cancel']"),
    data: {
      keepWhenMissingTarget: "[data-tour='transfers-create-transfer']",
    },
  },
  {
    target: "[data-tour='transfers-metrics']",
    title: "Financial summary",
    content: "View balance, window result, club's income and expenses for the season.",
    placement: "bottom",
  },
  {
    target: "[data-tour='transfers-current']",
    title: "Current window",
    content: "Movements are split between incoming and outgoing for easier reading.",
    placement: "top",
  },
  {
    target: "[data-tour='transfers-edit-transfer']",
    title: "Edit transfer",
    content: "The pencil opens an existing movement for correction. On advance, the system opens the edit modal automatically.",
    placement: "left",
  },
  {
    target: "[data-tour='transfer-modal']",
    title: "Edit movement",
    content: "In edit mode, review type, player, fee and clubs. On save, the window and history reflect the update.",
    placement: "center",
    before: openTargetBeforeStep("[data-tour='transfers-edit-transfer']", "[data-tour='transfer-modal']"),
    data: {
      keepWhenMissingTarget: "[data-tour='transfers-edit-transfer']",
    },
  },
  {
    target: "[data-tour='transfer-modal-save']",
    title: "Save correction",
    content: "This button saves the transfer correction. To preserve your data during the tutorial, we'll close without saving in the next step.",
    placement: "top",
    before: waitForTarget("[data-tour='transfer-modal-save']"),
    data: {
      keepWhenMissingTarget: "[data-tour='transfers-edit-transfer']",
    },
  },
  {
    target: "[data-tour='transfer-modal-cancel']",
    title: "Back to market",
    content: "Closing the modal returns you to the transfer hub.",
    placement: "top",
    before: waitForTarget("[data-tour='transfer-modal-cancel']"),
    after: clickAfterNext("[data-tour='transfer-modal-cancel']"),
    data: {
      keepWhenMissingTarget: "[data-tour='transfers-edit-transfer']",
    },
  },
  {
    target: "[data-tour='transfers-history']",
    title: "History",
    content: "When opening the history tab, these filters help cross-reference type, season and fee.",
    placement: "top",
  },
];

const statsSteps: Step[] = [
  {
    target: "[data-tour='stats-header']",
    title: "Season stats",
    content: "Use this screen to track campaign, competitions and individual rankings.",
    placement: "bottom",
  },
  {
    target: "[data-tour='hub-season-selector']",
    title: "Season filter",
    content: "Here you switch between available seasons to compare past campaigns.",
    placement: "bottom",
  },
  {
    target: "[data-tour='stats-campaign']",
    title: "Campaign summary",
    content: "Wins, draws, losses, win rate and top performer are all in this block.",
    placement: "bottom",
  },
  {
    target: "[data-tour='stats-competition-card']",
    title: "Competition stats",
    content: "Each card represents a competition for the season, with campaign, goals, goal difference and result. This is where you maintain the club's official performance record.",
    placement: "bottom",
  },
  {
    target: "[data-tour='stats-edit-competition']",
    title: "Edit stats",
    content: "The pencil opens the competition for editing. On advance, the system opens the modal automatically to show which fields update the season.",
    placement: "left",
  },
  {
    target: "[data-tour='stats-modal']",
    title: "Competition edit",
    content: "This modal updates the club's performance in that competition: campaign, goals and final result.",
    placement: "center",
    before: openTargetBeforeStep("[data-tour='stats-edit-competition']", "[data-tour='stats-modal']"),
    data: {
      keepWhenMissingTarget: "[data-tour='stats-edit-competition']",
    },
  },
  {
    target: "[data-tour='stats-modal-campaign']",
    title: "Campaign",
    content: "Update wins, draws and losses. The app automatically recalculates games, points and win rate.",
    placement: "bottom",
    before: waitForTarget("[data-tour='stats-modal-campaign']"),
    data: {
      keepWhenMissingTarget: "[data-tour='stats-edit-competition']",
    },
  },
  {
    target: "[data-tour='stats-modal-goals']",
    title: "Goals & difference",
    content: "Record goals scored and conceded. These values feed goal difference, goal average and campaign analysis.",
    placement: "top",
    before: waitForTarget("[data-tour='stats-modal-goals']"),
    data: {
      keepWhenMissingTarget: "[data-tour='stats-edit-competition']",
    },
  },
  {
    target: "[data-tour='stats-modal-result']",
    title: "Final result",
    content: "For leagues, enter the position; for cups, select the round reached or title won.",
    placement: "top",
    before: waitForTarget("[data-tour='stats-modal-result']"),
    data: {
      keepWhenMissingTarget: "[data-tour='stats-edit-competition']",
    },
  },
  {
    target: "[data-tour='stats-modal-cancel']",
    title: "Close without changes",
    content: "In the tutorial, we'll close without saving. When actually updating, use Save stats.",
    placement: "top",
    before: waitForTarget("[data-tour='stats-modal-cancel']"),
    after: clickAfterNext("[data-tour='stats-modal-cancel']"),
    data: {
      keepWhenMissingTarget: "[data-tour='stats-edit-competition']",
    },
  },
  {
    target: "[data-tour='stats-rankings']",
    title: "Individual rankings",
    content: "Switch between goals, assists, appearances and contributions to see the highlights.",
    placement: "top",
  },
];

const historySteps: Step[] = [
  {
    target: "[data-tour='history-hero']",
    title: "Career history",
    content: "The history view summarises legacy, titles, clubs and best campaigns in the save.",
    placement: "bottom",
  },
  {
    target: "[data-tour='history-clubs']",
    title: "Managed clubs",
    content: "Track your journey by club, seasons and tenure periods.",
    placement: "right",
  },
  {
    target: "[data-tour='history-trophies']",
    title: "Trophy cabinet",
    content: "All registered trophies are organised here for quick reference.",
    placement: "left",
  },
];

const changeClubSteps: Step[] = [
  {
    target: "[data-tour='change-club-hero']",
    title: "Club change",
    content: "Compare the current club with the next destination before signing.",
    placement: "bottom",
  },
  {
    target: "[data-tour='change-club-filters']",
    title: "Search & filters",
    content: "Filter by league or search to quickly find the next project.",
    placement: "bottom",
  },
  {
    target: "[data-tour='change-club-list']",
    title: "Club list",
    content: "Choose a club to open the proposal and set the budget and initial competition.",
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
    title: "Advance season",
    content: "When the year ends, use this shortcut to start the next season with a new budget.",
    placement: "right",
  },
  {
    target: "[data-tour='hub-help']",
    title: "Tutorial always available",
    content: "Even if you skip the initial invite, this button stays on screen to reopen the tutorial.",
    placement: "bottom",
  },
];

export { getHubTutorialSteps };
