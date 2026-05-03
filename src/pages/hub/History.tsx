import { useOutletContext } from "react-router-dom";
import HistoryScreen from "@/features/history/ui/HistoryScreen";
import { type HubOutletContext } from "@/widgets/hub-layout/ui/HubLayout";

const History = () => {
  const { saveId } = useOutletContext<HubOutletContext>();
  return <HistoryScreen saveId={saveId} />;
};

export default History;
