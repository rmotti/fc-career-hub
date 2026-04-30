import type { Step } from "react-joyride";

const MOBILE_PLACEMENT: Step["placement"] = "bottom";
const MOBILE_CENTER_TARGETS = new Set([
  "[data-tour='save-form']",
  "[data-tour='field-pitch']",
  "[data-tour='squad-table']",
  "[data-tour='transfers-current']",
  "[data-tour='player-modal']",
  "[data-tour='transfer-modal']",
  "[data-tour='stats-modal']",
]);

const isElementVisible = (element: Element) => {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth &&
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0"
  );
};

const resolveVisibleSteps = (tourSteps: Step[]) =>
  tourSteps
    .map((step) => {
      if (typeof step.target !== "string") return step;

      const target = Array.from(document.querySelectorAll(step.target)).find(isElementVisible);
      const keepWhenMissingTarget = step.data?.keepWhenMissingTarget;
      if (
        !target &&
        typeof keepWhenMissingTarget === "string" &&
        Array.from(document.querySelectorAll(keepWhenMissingTarget)).some(isElementVisible)
      ) {
        return step;
      }

      if (!target && step.data?.keepWhenMissing) return step;

      return target ? { ...step, target: target as HTMLElement } : null;
    })
    .filter((step): step is Step => Boolean(step));

const getResponsiveTutorialSteps = (tourSteps: Step[], isMobile: boolean) => {
  if (!isMobile) return tourSteps;

  return tourSteps.map((step) => {
    const originalTarget = typeof step.target === "string" ? step.target : undefined;
    const placement: Step["placement"] = originalTarget && MOBILE_CENTER_TARGETS.has(originalTarget) ? "center" : MOBILE_PLACEMENT;

    return {
      ...step,
      placement,
    };
  });
};

export { getResponsiveTutorialSteps, resolveVisibleSteps };
