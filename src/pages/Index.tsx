import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertTriangle, Download, Loader2 } from "lucide-react";
import SaveSelect from "@/features/saves/ui/SaveSelect";
import { useAuth } from "@/features/auth/model/useAuth";
import { useSaves, useCreateSave } from "@/features/saves/model/useSaves";
import { useImportFc26Players } from "@/features/squad/model/usePlayers";
import { getStoredActiveSaveId, setStoredActiveSaveId } from "@/features/auth/lib/auth-storage";
import { type ApiSave, extractErrorMessage } from "@/shared/api/client";
import { getTutorialPromptKey } from "@/features/tutorial/model/tutorialUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const { data: saves = [], isLoading: savesLoading } = useSaves();
  const createSave = useCreateSave();
  const importFc26 = useImportFc26Players();
  const [isRedirectingToDashboard, setIsRedirectingToDashboard] = useState(false);
  const [importPromptSave, setImportPromptSave] = useState<ApiSave | null>(null);
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

      toast.success("Save criado com sucesso!", { duration: 3000 });
      setImportPromptSave(newSave);
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

  const closeImportPromptAndGo = () => {
    setImportPromptSave(null);
    setIsRedirectingToDashboard(true);
    navigate("/dashboard", { replace: true });
  };

  const handleConfirmImport = async () => {
    if (!importPromptSave) return;
    try {
      const result = await importFc26.mutateAsync({ saveId: importPromptSave.id });
      toast.success(
        `Elenco importado: ${result.imported} jogador${result.imported === 1 ? "" : "es"}${
          result.skipped > 0 ? `, ${result.skipped} já existia${result.skipped === 1 ? "" : "m"}` : ""
        }.`,
        { duration: 4000 },
      );
    } catch (importErr) {
      toast.message("Não foi possível importar o elenco automaticamente.", {
        description: `${extractErrorMessage(importErr)} Você pode adicionar jogadores manualmente.`,
        duration: 6000,
      });
    } finally {
      closeImportPromptAndGo();
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
    <>
      <SaveSelect
        userName={user?.name ?? "Jogador"}
        userPlan={user?.plan ?? "FREE"}
        saves={saves}
        loading={savesLoading}
        onSelectSave={handleSelectSave}
        onCreateSave={handleCreateSave}
        onSignOut={handleSignOut}
        creating={createSave.isPending || importFc26.isPending || isRedirectingToDashboard}
      />

      <AlertDialog
        open={importPromptSave !== null}
        onOpenChange={(open) => {
          if (!open && !importFc26.isPending) closeImportPromptAndGo();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Download size={18} className="text-primary" />
              {t("squad.import.dialogTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  {t("squad.import.body")}
                </p>
                <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-foreground">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" />
                  <span>
                    {t("squad.import.warning")}
                  </span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={importFc26.isPending} onClick={closeImportPromptAndGo}>
              {t("squad.import.skip")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={importFc26.isPending}
              onClick={(event) => {
                event.preventDefault();
                handleConfirmImport();
              }}
            >
              {importFc26.isPending ? (
                <>
                  <Loader2 size={15} className="mr-2 animate-spin" /> {t("squad.import.importing")}
                </>
              ) : (
                t("squad.import.import")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Index;
