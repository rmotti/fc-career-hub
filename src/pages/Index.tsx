import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import SaveSelect from "@/components/SaveSelect";
import { useAuth } from "@/contexts/useAuth";
import { useSaves, useCreateSave } from "@/hooks/useSaves";
import { getStoredActiveSaveId, setStoredActiveSaveId } from "@/lib/auth-storage";
import { type ApiSave, extractErrorMessage } from "@/services/api";
import { getTutorialPromptKey } from "@/components/tutorial/HubTutorial";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signOut } = useAuth();
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
      const isFirstSave = saves.length === 0;
      const newSave = await createSave.mutateAsync({ name, club, budget, europeanCompetitionId });

      if (user) {
        setStoredActiveSaveId(user.id, newSave.id);
        if (isFirstSave) {
          localStorage.setItem(getTutorialPromptKey(user.id), "1");
        }
      }

      setIsRedirectingToDashboard(true);
      toast.success("Save criado com sucesso!", { duration: 3000 });
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setIsRedirectingToDashboard(false);
      const status = err?.status || err?.response?.status;
      const message =
        status === 409
          ? "Você atingiu o limite de saves do seu plano. Exclua um save ou faça upgrade."
          : extractErrorMessage(err);
      toast.error(message, { duration: 5000 });
      throw err;
    }
  };

  const handleSignOut = async () => {
    navigate("/", { replace: true });

    try {
      await signOut();
      toast.success("Sessão encerrada.");
    } catch {
      toast.error("Não foi possível encerrar a sessão.");
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
      onSignOut={handleSignOut}
      creating={createSave.isPending || isRedirectingToDashboard}
    />
  );
};

export default Index;
