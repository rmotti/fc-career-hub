import { useOutletContext } from "react-router-dom";
import TransfersScreen from "@/features/transfers/ui/TransfersScreen";
import { type HubOutletContext } from "@/widgets/hub-layout/ui/HubLayout";

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
