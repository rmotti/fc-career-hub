import { useOutletContext } from "react-router-dom";
import DashboardScreen from "@/components/hub/DashboardScreen";
import { type HubOutletContext } from "../HubLayout";

const Dashboard = () => {
  const { saveId, currentClub } = useOutletContext<HubOutletContext>();
  return <DashboardScreen saveId={saveId} currentClub={currentClub} />;
};

export default Dashboard;
