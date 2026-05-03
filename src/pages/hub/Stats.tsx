import { useOutletContext } from "react-router-dom";
import StatsScreen from "@/features/stats/ui/StatsScreen";
import { type HubOutletContext } from "@/widgets/hub-layout/ui/HubLayout";

const Stats = () => {
  const { saveId, selectedSeason, currentSeason, currentClubStintId } = useOutletContext<HubOutletContext>();
  return <StatsScreen saveId={saveId} selectedSeason={selectedSeason} currentSeason={currentSeason} currentClubStintId={currentClubStintId} />;
};

export default Stats;
