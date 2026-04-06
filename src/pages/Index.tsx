import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SaveSelect from "@/components/SaveSelect";
import { useSaves, useCreateSave } from "@/hooks/useSaves";
import { type ApiSave, extractErrorMessage } from "@/services/api";

const Index = () => {
  const navigate = useNavigate();
  const { data: saves = [], isLoading: savesLoading } = useSaves();
  const createSave = useCreateSave();

  useEffect(() => {
    if (localStorage.getItem("active-save-id")) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSelectSave = (save: ApiSave) => {
    localStorage.setItem("active-save-id", save.id);
    navigate("/dashboard");
  };

  const handleCreateSave = (name: string, club: string, budget: string) => {
    createSave.mutate({ name, club, budget }, {
      onSuccess: (newSave) => {
        localStorage.setItem("active-save-id", newSave.id);
        navigate("/dashboard");
        toast.success("Save criado com sucesso!", { duration: 3000 });
      },
      onError: (err) => toast.error(extractErrorMessage(err), { duration: 5000 }),
    });
  };

  return (
    <SaveSelect
      saves={saves}
      loading={savesLoading}
      onSelectSave={handleSelectSave}
      onCreateSave={handleCreateSave}
      creating={createSave.isPending}
    />
  );
};

export default Index;
