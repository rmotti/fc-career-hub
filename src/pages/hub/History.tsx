import { useOutletContext } from "react-router-dom";
import HistoryScreen from "@/components/hub/HistoryScreen";
import { type HubOutletContext } from "../HubLayout";

const History = () => {
  const { saveId } = useOutletContext<HubOutletContext>();
  return <HistoryScreen saveId={saveId} />;
};

export default History;
