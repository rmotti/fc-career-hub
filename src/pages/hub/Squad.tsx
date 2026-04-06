import { useOutletContext } from "react-router-dom";
import SquadScreen from "@/components/hub/SquadScreen";
import { type HubOutletContext } from "../HubLayout";

const Squad = () => {
  const { saveId, selectedSeason, currentSeason } = useOutletContext<HubOutletContext>();
  return <SquadScreen saveId={saveId} selectedSeason={selectedSeason} currentSeason={currentSeason} />;
};

export default Squad;
