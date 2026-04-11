import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SaveSelect from "@/components/SaveSelect";
import { useAuth } from "@/contexts/AuthContext";
import { useSaves, useCreateSave } from "@/hooks/useSaves";
import { getStoredActiveSaveId, setStoredActiveSaveId } from "@/lib/auth-storage";
import { type ApiSave, extractErrorMessage } from "@/services/api";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: saves = [], isLoading: savesLoading } = useSaves();
  const createSave = useCreateSave();

  useEffect(() => {
    if (user && getStoredActiveSaveId(user.id)) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, user]);

  const handleSelectSave = (save: ApiSave) => {
    if (!user) {
      return;
    }

    setStoredActiveSaveId(user.id, save.id);
    navigate("/dashboard");
  };

  const handleCreateSave = (name: string, club: string, budget: string) => {
    createSave.mutate({ name, club, budget }, {
      onSuccess: (newSave) => {
        if (user) {
          setStoredActiveSaveId(user.id, newSave.id);
        }
        navigate("/dashboard");
        toast.success("Save criado com sucesso!", { duration: 3000 });
      },
      onError: (err) => toast.error(extractErrorMessage(err), { duration: 5000 }),
    });
  };

  return (
    <SaveSelect
      userName={user?.name ?? "Jogador"}
      userPlan={user?.plan ?? "FREE"}
      saves={saves}
      loading={savesLoading}
      onSelectSave={handleSelectSave}
      onCreateSave={handleCreateSave}
      creating={createSave.isPending}
    />
  );
};

export default Index;
