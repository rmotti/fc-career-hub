import type { Step } from "react-joyride";

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
      return target ? { ...step, target: target as HTMLElement } : null;
    })
    .filter((step): step is Step => Boolean(step));

export { resolveVisibleSteps };
