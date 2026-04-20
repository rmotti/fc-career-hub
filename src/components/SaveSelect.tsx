import { useState } from "react";
import { Plus, Gamepad2, Shield, Calendar, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { extractErrorMessage, type ApiSave, type UserPlan } from "@/services/api";
import { useClubsByLeague } from "@/hooks/useClubs";
import { useEuropeanCompetitions } from "@/hooks/useCompetitions";
import { useDeleteSave } from "@/hooks/useSaves";
import { parseBudgetInMillionsInput } from "@/utils/currency";

interface Props {
  userName: string;
  userPlan: UserPlan;
  saves: ApiSave[];
  loading: boolean;
  onSelectSave: (save: ApiSave) => void;
  onCreateSave: (name: string, club: string, budget: string, europeanCompetitionId: string | null) => Promise<void>;
  creating: boolean;
}

const SaveSelect = ({ userName, userPlan, saves, loading, onSelectSave, onCreateSave, creating }: Props) => {
  const [showForm, setShowForm] = useState(false);
  const deleteSave = useDeleteSave();
  const [newName, setNewName] = useState("");
  const [newLeague, setNewLeague] = useState("");
  const [newClub, setNewClub] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [newEuropeanCompetitionId, setNewEuropeanCompetitionId] = useState<string>("none");
  const [budgetError, setBudgetError] = useState("");
  const { data: clubsByLeague = {} } = useClubsByLeague();
  const { data: europeanCompetitions = [] } = useEuropeanCompetitions();

  const leagueNames = Object.keys(clubsByLeague);
  const clubsForLeague: string[] = newLeague ? (clubsByLeague[newLeague] ?? []) : [];

  const handleBudgetBlur = () => {
    const num = parseBudgetInMillionsInput(newBudget);
    if (num === null) {
      setBudgetError("Orçamento deve ser um número válido em milhões (ex: 100 para 100M)");
    } else {
      setBudgetError("");
    }
  };

  const handleCreate = async () => {
    const num = parseBudgetInMillionsInput(newBudget);
    if (!newName.trim()) return;
    if (!newClub) return;
    if (num === null) {
      setBudgetError("Orçamento obrigatório e deve ser um número válido em milhões");
      return;
    }
    setBudgetError("");

    try {
      await onCreateSave(
        newName.trim(),
        newClub,
        String(num),
        newEuropeanCompetitionId === "none" ? null : newEuropeanCompetitionId
      );
      setShowForm(false);
      setNewName("");
      setNewLeague("");
      setNewClub("");
      setNewBudget("");
      setNewEuropeanCompetitionId("none");
    } catch {
      // A mensagem de erro ja e exibida no fluxo de criacao.
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6 pb-12 w-full max-w-5xl mx-auto space-y-16 py-12">
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
          <div className="card-gamer flex min-w-[280px] flex-col items-center gap-4 p-8 text-center">
            <Loader2 size={28} className="animate-spin text-primary" />
            <div className="space-y-1">
              <p className="font-display text-lg font-bold text-foreground">Preparando seu save</p>
              <p className="text-sm text-muted-foreground">Estamos criando a carreira e redirecionando para o dashboard...</p>
            </div>
          </div>
        </div>
      )}
      
      {/* 1. Header / Hero */}
      <section className="text-center w-full mt-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Gamepad2 size={36} className="text-primary" />
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
            FC 26 <span className="text-primary text-glow-primary">HUB</span>
          </h1>
        </div>
        <p className="text-muted-foreground text-lg sm:text-xl font-medium mb-1">Gerencie seus saves do Modo Carreira</p>
        <p className="text-muted-foreground/60 text-sm">
          Olá, {userName} • Plano {userPlan}
        </p>
      </section>

      {/* 2. Action Buttons & Form */}
      <section className="w-full max-w-3xl">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground py-12 bg-card rounded-xl border border-border">
            <Loader2 size={24} className="animate-spin text-primary" />
            <span className="font-medium">Carregando saves...</span>
          </div>
        ) : !showForm ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {saves.map((save) => (
                <div key={save.id} className="relative group/card">
                  <button
                    onClick={() => onSelectSave(save)}
                    className="card-gamer p-6 text-left hover:border-primary/50 transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 w-full"
                  >
                    <h3 className="font-display text-xl font-bold group-hover:text-primary transition-colors mb-4 truncate pr-8">
                      {save.name}
                    </h3>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Shield size={16} className="text-primary/80" />
                        <span className="font-medium truncate">{save.currentClubStint?.club ?? "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar size={16} className="text-muted-foreground/80" />
                        <span>Temporada {save.currentSeason}</span>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Deletar o save "${save.name}"? Esta ação não pode ser desfeita.`)) {
                        deleteSave.mutate(save.id, {
                          onError: (error) => {
                            toast.error(extractErrorMessage(error), { duration: 5000 });
                          },
                        });
                      }
                    }}
                    disabled={deleteSave.isPending}
                    className="absolute top-3 right-3 p-1.5 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover/card:opacity-100"
                    title="Deletar save"
                  >
                    {deleteSave.isPending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="w-full card-gamer p-5 flex items-center justify-center gap-2 text-primary hover:bg-primary/5 transition-all duration-300 font-display font-semibold text-lg border-dashed border-2 hover:border-primary/60 group"
            >
              <Plus size={24} className="group-hover:scale-110 transition-transform" />
              Criar Novo Save
            </button>
          </div>
        ) : (
          <div className="card-gamer p-6 sm:p-8 space-y-6 slide-in-bottom">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="bg-primary/10 p-2 rounded-lg text-primary">
                <Plus size={24} />
              </div>
              <h3 className="font-display text-2xl font-bold">Iniciando nova jornada</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block tracking-wider">Nome do Save</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: A Dinastia"
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block tracking-wider">Liga</label>
                  <select
                    value={newLeague}
                    onChange={(e) => { setNewLeague(e.target.value); setNewClub(""); }}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow appearance-none"
                  >
                    <option value="">Selecione a liga...</option>
                    {leagueNames.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block tracking-wider">Time Inicial</label>
                  <select
                    value={newClub}
                    onChange={(e) => setNewClub(e.target.value)}
                    disabled={!newLeague}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Selecione o time...</option>
                    {clubsForLeague.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block tracking-wider">Orçamento inicial</label>
                <input
                  type="text"
                  value={newBudget}
                  onChange={(e) => { setNewBudget(e.target.value); setBudgetError(""); }}
                  onBlur={handleBudgetBlur}
                  placeholder="Ex: 100"
                  className={`w-full bg-background border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 transition-shadow ${budgetError ? "border-destructive focus:ring-destructive/50" : "border-border focus:ring-primary/50"}`}
                />
                <p className="text-xs text-muted-foreground mt-1.5">Digite o valor em milhões. Ex.: `100` = `100M`.</p>
                {budgetError && <p className="text-xs text-destructive mt-1.5 font-medium">{budgetError}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block tracking-wider">Competição Europeia Inicial</label>
                <select
                  value={newEuropeanCompetitionId}
                  onChange={(e) => setNewEuropeanCompetitionId(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow appearance-none"
                >
                  <option value="none">Nenhuma</option>
                  {europeanCompetitions.map((competition) => (
                    <option key={competition.id} value={competition.id}>{competition.name}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1.5">Opcional para a 1ª temporada.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-display font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-primary/20"
              >
                {creating ? (
                  <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Criando...</span>
                ) : "Iniciar Carreira"}
              </button>
              <button
                onClick={() => { setShowForm(false); setNewLeague(""); setNewClub(""); setBudgetError(""); setNewEuropeanCompetitionId("none"); }}
                className="flex-1 bg-muted text-foreground py-3 rounded-lg font-medium text-sm hover:bg-muted/80 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 3. Footer */}
      <footer className="w-full text-center pt-8 border-t border-border/50">
        <p className="text-sm text-muted-foreground/60 font-medium">FC 26 Hub · Feito para jogadores de Modo Carreira</p>
      </footer>
    </div>
  );
};

export default SaveSelect;
