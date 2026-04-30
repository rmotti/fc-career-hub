import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, Navigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import HubSidebar from "@/components/hub/HubSidebar";
import HubHeader from "@/components/hub/HubHeader";
import NewSeasonModal from "@/components/modals/NewSeasonModal";
import HubTutorial from "@/components/tutorial/HubTutorial";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/useAuth";
import { useSave, useUpdateSave } from "@/hooks/useSaves";
import { clearStoredActiveSaveId, getStoredActiveSaveId } from "@/lib/auth-storage";
import { extractErrorMessage, playersApi, transfersApi } from "@/services/api";
import { normalizeStoredBudget } from "@/utils/currency";
import { getInactivePlayersToReactivate } from "@/utils/playerTransferStatus";

export type HubOutletContext = {
  saveId: string;
  currentClub: string;
  selectedSeason: string;
  currentSeason: string;
  currentClubStintId: string | null;
};

const HubLayout = () => {
  const { user, signOut } = useAuth();
  const activeSaveId = user ? getStoredActiveSaveId(user.id) : null;
  const [showNewSeasonModal, setShowNewSeasonModal] = useState(false);
  const [tutorialRequest, setTutorialRequest] = useState(0);
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });
  const normalizedBudgetPatchRef = useRef<Set<string>>(new Set());

  const { data: activeSave, isError, error, refetch: refetchActiveSave } = useSave(activeSaveId);
  const updateSave = useUpdateSave();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (activeSave?.currentSeason) {
      setSelectedSeason(activeSave.currentSeason);
    }
  }, [activeSave?.currentSeason, activeSave?.currentClubStint?.id]);

  useEffect(() => {
    if (!activeSave) return;

    const normalizedBudget = normalizeStoredBudget(activeSave.budget);
    const needsLegacyBudgetFix = normalizedBudget !== activeSave.budget;

    if (!needsLegacyBudgetFix || normalizedBudgetPatchRef.current.has(activeSave.id)) {
      return;
    }

    normalizedBudgetPatchRef.current.add(activeSave.id);

    updateSave.mutate(
      {
        saveId: activeSave.id,
        data: { budget: String(normalizedBudget) },
      },
      {
        onError: () => {
          normalizedBudgetPatchRef.current.delete(activeSave.id);
        },
      }
    );
  }, [activeSave, updateSave]);

  useEffect(() => {
    const status = (error as { status?: number } | null)?.status;

    if (user && isError && activeSaveId && status === 404) {
      clearStoredActiveSaveId(user.id);
      navigate("/app", { replace: true });
      toast.error("Não foi possível abrir esse save. Escolha outro para continuar.", { duration: 5000 });
    }
  }, [activeSaveId, error, isError, navigate, user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!activeSaveId) {
    return <Navigate to="/app" replace />;
  }

  if (!activeSave) {
    if (isError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-6 text-foreground">
          <div className="card-gamer max-w-md p-6 text-center">
            <h1 className="font-display text-xl font-bold">Não foi possível carregar o save</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              A sessão continua aberta, mas a última atualização do save falhou.
            </p>
            <button
              onClick={() => void refetchActiveSave()}
              className="mt-5 rounded-md bg-primary px-4 py-2 font-display text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6 text-foreground">
        <div className="text-muted-foreground animate-pulse font-display text-lg">Carregando save...</div>
      </div>
    );
  }

  const handleToggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  const handleNewSeason = async (budget: number, europeanCompetitionId: string | null): Promise<boolean> => {
    const currentYear = parseInt(String(activeSave.currentYear), 10);
    if (isNaN(currentYear)) {
      toast.error("Temporada atual inválida. Recarregue a página.", { duration: 5000 });
      return false;
    }
    const newYear = currentYear + 1;
    const newSeason = `${newYear}/${(newYear + 1).toString().slice(-2)}`;

    try {
      const [allPlayers, allTransfers] = await Promise.all([
        playersApi.list(activeSave.id),
        transfersApi.list(activeSave.id),
      ]);
      const playersToReactivate = getInactivePlayersToReactivate(allPlayers, allTransfers);
      if (playersToReactivate.length > 0) {
        await Promise.all(playersToReactivate.map((player) => playersApi.update(activeSave.id, player.id, { isActive: true })));
        await queryClient.invalidateQueries({ queryKey: ["players", activeSave.id] });
      }

      await updateSave.mutateAsync({
        saveId: activeSave.id,
        data: { currentYear: newYear, currentSeason: newSeason, budget: String(budget), europeanCompetitionId },
      });
      navigate("/dashboard");
      toast.success("Nova temporada iniciada!", { duration: 3000 });
      return true;
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err), { duration: 5000 });
      return false;
    }
  };

  const handleExitSave = () => {
    clearStoredActiveSaveId(user.id);
    navigate("/app?switch=1");
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

  const currentClub = activeSave.currentClubStint?.club ?? "—";
  const statsSeason = selectedSeason || activeSave.currentSeason;
  const isStatsRoute = location.pathname.startsWith("/stats");
  const outletSeason = isStatsRoute ? statsSeason : activeSave.currentSeason;

  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      <HubSidebar
        userName={user.name}
        userPlan={user.plan}
        saveName={activeSave.name}
        clubName={currentClub}
        season={activeSave.currentSeason}
        onNewSeason={() => setShowNewSeasonModal(true)}
        onExitSave={handleExitSave}
        onSignOut={handleSignOut}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HubHeader
          saveName={activeSave.name}
          clubName={currentClub}
          season={activeSave.currentSeason}
          availableSeasons={activeSave.availableSeasons}
          selectedSeason={statsSeason}
          onSeasonChange={setSelectedSeason}
          showSeasonSelector={isStatsRoute}
          onStartTutorial={() => setTutorialRequest((request) => request + 1)}
        />
        <main className="min-h-0 flex-1 overflow-y-auto p-6 w-full max-w-full">
          <Outlet
            context={{
              saveId: activeSave.id,
              currentClub,
              selectedSeason: outletSeason,
              currentSeason: activeSave.currentSeason,
              currentClubStintId: activeSave.currentClubStint?.id ?? null,
            } satisfies HubOutletContext}
          />
        </main>
      </div>
      <NewSeasonModal
        open={showNewSeasonModal}
        onOpenChange={setShowNewSeasonModal}
        saveId={activeSave.id}
        currentSeason={activeSave.currentSeason}
        currentClub={currentClub}
        onConfirm={handleNewSeason}
      />
      <HubTutorial userId={user.id} startRequest={tutorialRequest} />
    </div>
  );
};

export default HubLayout;
