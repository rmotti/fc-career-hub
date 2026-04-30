import { useState } from "react";
import { Joyride, STATUS, type EventData, type Step } from "react-joyride";
import { saveSelectTutorialSteps } from "@/components/tutorial/saveSelectTutorialSteps";
import TutorialHelpButton from "@/components/tutorial/TutorialHelpButton";
import TutorialTooltip from "@/components/tutorial/TutorialTooltip";
import { tutorialJoyrideStyles, tutorialLocale, tutorialOptions } from "@/components/tutorial/tutorialStyles";
import { resolveVisibleSteps } from "@/components/tutorial/tutorialUtils";

const SaveSelectTutorial = () => {
  const [run, setRun] = useState(false);
  const [tourKey, setTourKey] = useState(0);
  const [activeSteps, setActiveSteps] = useState<Step[]>(saveSelectTutorialSteps);

  const startTutorial = () => {
    setRun(false);
    window.setTimeout(() => {
      const nextSteps = resolveVisibleSteps(saveSelectTutorialSteps);
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
