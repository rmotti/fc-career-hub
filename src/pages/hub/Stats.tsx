import { useOutletContext } from "react-router-dom";
import StatsScreen from "@/components/hub/StatsScreen";
import { type HubOutletContext } from "../HubLayout";

const Stats = () => {
  const { saveId, selectedSeason, currentSeason } = useOutletContext<HubOutletContext>();
  return <StatsScreen saveId={saveId} selectedSeason={selectedSeason} currentSeason={currentSeason} />;
};

export default Stats;
