import { useOutletContext } from "react-router-dom";
import TransfersScreen from "@/components/hub/TransfersScreen";
import { type HubOutletContext } from "../HubLayout";

const Transfers = () => {
  const { saveId, currentClub, currentSeason, selectedSeason } = useOutletContext<HubOutletContext>();
  return (
    <TransfersScreen
      saveId={saveId}
      currentClub={currentClub}
      currentSeason={currentSeason}
      selectedSeason={selectedSeason}
    />
  );
};

export default Transfers;
