import { useOutletContext } from "react-router-dom";
import PlaybooksScreen from "@/features/playbooks/ui/PlaybooksScreen";
import { type HubOutletContext } from "@/widgets/hub-layout/ui/HubLayout";

const Playbooks = () => {
  const { saveId, currentClub, currentSeason } = useOutletContext<HubOutletContext>();

  return (
    <PlaybooksScreen
      saveId={saveId}
      currentClub={currentClub}
      currentSeason={currentSeason}
    />
  );
};

export default Playbooks;
