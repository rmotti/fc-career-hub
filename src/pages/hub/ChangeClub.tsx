import { useOutletContext } from "react-router-dom";
import ChangeClubScreen from "@/features/change-club/ui/ChangeClubScreen";
import { type HubOutletContext } from "@/widgets/hub-layout/ui/HubLayout";

const ChangeClub = () => {
  const { saveId, currentClub } = useOutletContext<HubOutletContext>();
  return <ChangeClubScreen saveId={saveId} currentClub={currentClub} />;
};

export default ChangeClub;
