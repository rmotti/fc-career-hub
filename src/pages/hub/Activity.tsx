import { useOutletContext } from "react-router-dom";
import ActivityScreen from "@/features/activity/ui/ActivityScreen";
import { type HubOutletContext } from "@/widgets/hub-layout/ui/HubLayout";

const Activity = () => {
  const { saveId } = useOutletContext<HubOutletContext>();
  return <ActivityScreen saveId={saveId} />;
};

export default Activity;
