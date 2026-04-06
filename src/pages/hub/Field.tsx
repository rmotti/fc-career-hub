import { useOutletContext } from "react-router-dom";
import FieldScreen from "@/components/hub/FieldScreen";
import { type HubOutletContext } from "../HubLayout";

const Field = () => {
  const { saveId } = useOutletContext<HubOutletContext>();
  return <FieldScreen saveId={saveId} />;
};

export default Field;
