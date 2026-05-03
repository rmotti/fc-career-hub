import { useOutletContext } from "react-router-dom";
import ScoutScreen from "@/components/hub/ScoutScreen";
import { type HubOutletContext } from "../HubLayout";

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
