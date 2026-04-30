import { useEffect, useState } from "react";
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
} from "@/components/ui/dialog";
import { getHubTutorialSteps } from "@/components/tutorial/hubTutorialSteps";
import TutorialTooltip from "@/components/tutorial/TutorialTooltip";
import { tutorialJoyrideStyles, tutorialLocale, tutorialOptions } from "@/components/tutorial/tutorialStyles";
import { resolveVisibleSteps } from "@/components/tutorial/tutorialUtils";

const promptKey = (userId: string) => `fcch:tutorial-prompt:${userId}`;

interface HubTutorialProps {
  userId: string;
  startRequest: number;
}

const HubTutorial = ({ userId, startRequest }: HubTutorialProps) => {
  const location = useLocation();
  const [run, setRun] = useState(false);
  const [tourKey, setTourKey] = useState(0);
  const [activeSteps, setActiveSteps] = useState<Step[]>(getHubTutorialSteps(location.pathname));
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(promptKey(userId)) === "1") {
      setShowPrompt(true);
    }
  }, [userId]);

  useEffect(() => {
    if (startRequest > 0) {
      startTutorial();
    }
  }, [startRequest]);

  const startTutorial = () => {
    localStorage.removeItem(promptKey(userId));
    setShowPrompt(false);

    const launch = () => {
      setRun(false);
      window.setTimeout(() => {
        const nextSteps = resolveVisibleSteps(getHubTutorialSteps(location.pathname));
        if (nextSteps.length === 0) return;

        setActiveSteps(nextSteps);
        setTourKey((key) => key + 1);
        setRun(true);
      }, 220);
    };

    launch();
  };

  const skipTutorial = () => {
    localStorage.removeItem(promptKey(userId));
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
            <DialogTitle className="font-display text-2xl leading-none">Quer um tour rápido?</DialogTitle>
            <DialogDescription className="leading-6">
              Seu primeiro save está pronto. O tutorial mostra onde ficam os atalhos principais e pode ser reaberto pelo botão de ajuda depois.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:space-x-0">
            <button
              type="button"
              onClick={skipTutorial}
              className="rounded-md border border-border bg-background/50 px-4 py-2.5 font-display text-sm font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              Pular agora
            </button>
            <button
              type="button"
              onClick={startTutorial}
              className="rounded-md bg-primary px-4 py-2.5 font-display text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Começar tutorial
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { promptKey as getTutorialPromptKey };
export default HubTutorial;
