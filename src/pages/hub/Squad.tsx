import { useOutletContext } from "react-router-dom";
import SquadScreen from "@/features/squad/ui/SquadScreen";
import { type HubOutletContext } from "@/widgets/hub-layout/ui/HubLayout";

const Squad = () => {
  const { saveId, selectedSeason, currentSeason } = useOutletContext<HubOutletContext>();
  return <SquadScreen saveId={saveId} selectedSeason={selectedSeason} currentSeason={currentSeason} />;
};

export default Squad;
