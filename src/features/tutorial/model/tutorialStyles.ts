import type { Options } from "react-joyride";

const tutorialJoyrideStyles = {
  options: {
    arrowColor: "hsl(220 16% 12%)",
    backgroundColor: "hsl(220 16% 12%)",
    overlayColor: "hsl(220 20% 7% / 0.78)",
    primaryColor: "hsl(142 70% 49%)",
    textColor: "hsl(210 20% 92%)",
    zIndex: 120,
  },
  floater: {
    filter: "drop-shadow(0 18px 46px hsl(220 20% 3% / 0.5))",
  },
  tooltip: {
    backgroundColor: "transparent",
    border: 0,
    borderRadius: 8,
    boxShadow: "none",
    padding: 0,
  },
};

const tutorialLocale = {
  back: "Back",
  close: "Close",
  last: "Finish",
  next: "Next",
  skip: "Skip",
};

const tutorialOptions: Partial<Options> = {
  overlayClickAction: false,
  scrollOffset: 72,
  showProgress: true,
  buttons: ["back", "skip", "primary"],
};

export { tutorialJoyrideStyles, tutorialLocale, tutorialOptions };
