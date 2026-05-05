import { useOutletContext } from "react-router-dom";
import ScoutScreen, { type ScoutSection } from "@/features/scout/ui/ScoutScreen";
import { type HubOutletContext } from "@/widgets/hub-layout/ui/HubLayout";

interface ScoutProps {
  section: ScoutSection;
}

const Scout = ({ section }: ScoutProps) => {
  const { saveId, currentClub, currentSeason } = useOutletContext<HubOutletContext>();

  return (
    <ScoutScreen
      section={section}
      saveId={saveId}
      currentClub={currentClub}
      currentSeason={currentSeason}
    />
  );
};

export default Scout;
