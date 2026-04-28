import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import SaveSelect from "@/components/SaveSelect";
import { useAuth } from "@/contexts/AuthContext";
import { useSaves, useCreateSave } from "@/hooks/useSaves";
import { getStoredActiveSaveId, setStoredActiveSaveId } from "@/lib/auth-storage";
import { type ApiSave, extractErrorMessage } from "@/services/api";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { data: saves = [], isLoading: savesLoading } = useSaves();
  const createSave = useCreateSave();
  const [isRedirectingToDashboard, setIsRedirectingToDashboard] = useState(false);
  const isSwitchingSave = searchParams.get("switch") === "1";

  useEffect(() => {
    if (user && getStoredActiveSaveId(user.id) && !isSwitchingSave) {
      navigate("/dashboard", { replace: true });
    }
  }, [isSwitchingSave, navigate, user]);

  const handleSelectSave = (save: ApiSave) => {
    if (!user) {
      return;
    }

    setStoredActiveSaveId(user.id, save.id);
    navigate("/dashboard");
  };

  const handleCreateSave = async (name: string, club: string, budget: string, europeanCompetitionId: string | null) => {
    try {
      setIsRedirectingToDashboard(false);
      const newSave = await createSave.mutateAsync({ name, club, budget, europeanCompetitionId });

      if (user) {
        setStoredActiveSaveId(user.id, newSave.id);
      }

      setIsRedirectingToDashboard(true);
      toast.success("Save criado com sucesso!", { duration: 3000 });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setIsRedirectingToDashboard(false);
      toast.error(extractErrorMessage(err), { duration: 5000 });
      throw err;
    }
  };

  return (
    <SaveSelect
      userName={user?.name ?? "Jogador"}
      userPlan={user?.plan ?? "FREE"}
      saves={saves}
      loading={savesLoading}
      onSelectSave={handleSelectSave}
      onCreateSave={handleCreateSave}
      creating={createSave.isPending || isRedirectingToDashboard}
    />
  );
};

export default Index;
