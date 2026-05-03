import { useOutletContext } from "react-router-dom";
import FieldScreen from "@/features/field/ui/FieldScreen";
import { type HubOutletContext } from "@/widgets/hub-layout/ui/HubLayout";

const Field = () => {
  const { saveId } = useOutletContext<HubOutletContext>();
  return <FieldScreen saveId={saveId} />;
};

export default Field;
