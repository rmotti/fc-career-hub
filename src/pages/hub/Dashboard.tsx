import { useOutletContext } from "react-router-dom";
import DashboardScreen from "@/features/dashboard/ui/DashboardScreen";
import { type HubOutletContext } from "@/widgets/hub-layout/ui/HubLayout";

const Dashboard = () => {
  const { saveId } = useOutletContext<HubOutletContext>();
  return <DashboardScreen saveId={saveId} />;
};

export default Dashboard;
