import { useState } from "react";
import { Joyride, STATUS, type EventData, type Step } from "react-joyride";
import { saveSelectTutorialSteps } from "@/features/tutorial/model/saveSelectTutorialSteps";
import TutorialHelpButton from "@/features/tutorial/ui/TutorialHelpButton";
import TutorialTooltip from "@/features/tutorial/ui/TutorialTooltip";
import { tutorialJoyrideStyles, tutorialLocale, tutorialOptions } from "@/features/tutorial/model/tutorialStyles";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { getResponsiveTutorialSteps, resolveVisibleSteps } from "@/features/tutorial/model/tutorialUtils";

const SaveSelectTutorial = () => {
  const isMobile = useIsMobile();
  const [run, setRun] = useState(false);
  const [tourKey, setTourKey] = useState(0);
  const [activeSteps, setActiveSteps] = useState<Step[]>(saveSelectTutorialSteps);

  const startTutorial = () => {
    setRun(false);
    window.setTimeout(() => {
      const nextSteps = resolveVisibleSteps(getResponsiveTutorialSteps(saveSelectTutorialSteps, isMobile));
      if (nextSteps.length === 0) return;

      setActiveSteps(nextSteps);
      setTourKey((key) => key + 1);
      setRun(true);
    }, 220);
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
      <TutorialHelpButton onClick={startTutorial} className="bg-card/70" />
    </>
  );
};

export default SaveSelectTutorial;
