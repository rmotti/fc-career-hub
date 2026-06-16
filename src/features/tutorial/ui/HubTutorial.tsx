import { useCallback, useEffect, useState } from "react";
import { Joyride, STATUS, type EventData, type Step } from "react-joyride";
import { useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { getHubTutorialSteps } from "@/features/tutorial/model/hubTutorialSteps";
import TutorialTooltip from "@/features/tutorial/ui/TutorialTooltip";
import { tutorialJoyrideStyles, tutorialLocale, tutorialOptions } from "@/features/tutorial/model/tutorialStyles";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { getResponsiveTutorialSteps, getTutorialPromptKey, resolveVisibleSteps } from "@/features/tutorial/model/tutorialUtils";

interface HubTutorialProps {
  userId: string;
  startRequest: number;
}

const HubTutorial = ({ userId, startRequest }: HubTutorialProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [run, setRun] = useState(false);
  const [tourKey, setTourKey] = useState(0);
  const [activeSteps, setActiveSteps] = useState<Step[]>(getHubTutorialSteps(location.pathname));
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(getTutorialPromptKey(userId)) === "1") {
      setShowPrompt(true);
    }
  }, [userId]);

  const startTutorial = useCallback(() => {
    localStorage.removeItem(getTutorialPromptKey(userId));
    setShowPrompt(false);

    setRun(false);
    window.setTimeout(() => {
      const nextSteps = resolveVisibleSteps(getResponsiveTutorialSteps(getHubTutorialSteps(location.pathname), isMobile));
      if (nextSteps.length === 0) return;

      setActiveSteps(nextSteps);
      setTourKey((key) => key + 1);
      setRun(true);
    }, 220);
  }, [userId, location.pathname, isMobile]);

  useEffect(() => {
    if (startRequest > 0) {
      startTutorial();
    }
  }, [startRequest, startTutorial]);

  const skipTutorial = () => {
    localStorage.removeItem(getTutorialPromptKey(userId));
    setShowPrompt(false);
  };

  const handleJoyrideCallback = (data: EventData) => {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      setRun(false);
    }
  };

  return (
    <>
      <Joyride
        key={tourKey}
        continuous
        locale={tutorialLocale}
        onEvent={handleJoyrideCallback}
        options={tutorialOptions}
        run={run}
        steps={activeSteps}
        styles={tutorialJoyrideStyles}
        tooltipComponent={TutorialTooltip}
      />

      <Dialog open={showPrompt} onOpenChange={(open) => !open && skipTutorial()}>
        <DialogContent className="border-border bg-card sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
              <Sparkles size={21} />
            </div>
            <DialogTitle className="font-display text-2xl leading-none">Want a quick tour?</DialogTitle>
            <DialogDescription className="leading-6">
              Your first save is ready. The tutorial shows where the main shortcuts are and can be reopened later from the help button.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:space-x-0">
            <button
              type="button"
              onClick={skipTutorial}
              className="rounded-md border border-border bg-background/50 px-4 py-2.5 font-display text-sm font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              Skip for now
            </button>
            <button
              type="button"
              onClick={startTutorial}
              className="rounded-md bg-primary px-4 py-2.5 font-display text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Start tutorial
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HubTutorial;
