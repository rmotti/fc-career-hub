import { useOutletContext } from "react-router-dom";
import ScoutScreen from "@/features/scout/ui/ScoutScreen";
import { type HubOutletContext } from "@/widgets/hub-layout/ui/HubLayout";

const Scout = () => {
  const { currentClub, currentSeason } = useOutletContext<HubOutletContext>();

  return (
    <ScoutScreen
      currentClub={currentClub}
      currentSeason={currentSeason}
    />
  );
};

export default Scout;
