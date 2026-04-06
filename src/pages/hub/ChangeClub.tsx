import { useOutletContext } from "react-router-dom";
import ChangeClubScreen from "@/components/hub/ChangeClubScreen";
import { type HubOutletContext } from "../HubLayout";

const ChangeClub = () => {
  const { saveId, currentClub } = useOutletContext<HubOutletContext>();
  return <ChangeClubScreen saveId={saveId} currentClub={currentClub} />;
};

export default ChangeClub;
