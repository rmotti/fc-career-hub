import { useOutletContext } from "react-router-dom";
import StatsScreen from "@/components/hub/StatsScreen";
import { type HubOutletContext } from "../HubLayout";

const Stats = () => {
  const { saveId, selectedSeason, currentSeason, currentClubStintId } = useOutletContext<HubOutletContext>();
  return <StatsScreen saveId={saveId} selectedSeason={selectedSeason} currentSeason={currentSeason} currentClubStintId={currentClubStintId} />;
};

export default Stats;
