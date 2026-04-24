import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Shield, Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useClubs } from "@/hooks/useClubs";
import { useEuropeanCompetitions } from "@/hooks/useCompetitions";
import { useChangeClub } from "@/hooks/useClubStints";
import { useUpdateSave } from "@/hooks/useSaves";
import { extractErrorMessage } from "@/services/api";
import { parseBudgetInMillionsInput } from "@/utils/currency";
import { CLUBS_BY_LEAGUE } from "@/utils/leagues";

interface Props {
  saveId: string;
  currentClub: string;
}

const ChangeClubScreen = ({ saveId, currentClub }: Props) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState("");
  const [budgetError, setBudgetError] = useState("");
  const [europeanCompetitionId, setEuropeanCompetitionId] = useState("none");
  const { data: allClubs = [], isLoading } = useClubs();
  const { data: europeanCompetitions = [] } = useEuropeanCompetitions();
  const changeClub = useChangeClub();
  const updateSave = useUpdateSave();
  const navigate = useNavigate();

  const handleBudgetBlur = () => {
    const budget = parseBudgetInMillionsInput(budgetInput);
    if (budget === null) {
      setBudgetError("Orçamento deve ser um número válido em milhões (ex: 100 para 100M)");
      return;
    }
    setBudgetError("");
  };

  const handleConfirm = async () => {
    if (!selected) return;

    const budget = parseBudgetInMillionsInput(budgetInput);
    if (budget === null) {
      setBudgetError("Orçamento obrigatório e deve ser um número válido em milhões");
      return;
    }

    try {
      await changeClub.mutateAsync({ saveId, club: selected });
      await updateSave.mutateAsync({
        saveId,
        data: {
          budget: String(budget),
          europeanCompetitionId: europeanCompetitionId === "none" ? null : europeanCompetitionId,
        },
      });

      toast.success(`Agora você gerencia o ${selected}!`, { duration: 3000 });
      navigate("/dashboard");
    } catch (err) {
      toast.error(extractErrorMessage(err), { duration: 5000 });
    }
  };

  const isSubmitting = changeClub.isPending || updateSave.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
        <Loader2 size={20} className="animate-spin" /> Carregando clubes...
      </div>
    );
  }

  // Grupos de clubes separados por liga
  const availableClubs = allClubs.filter(c => c !== currentClub);
  
  const groupedClubs = Object.entries(CLUBS_BY_LEAGUE).map(([league, leagueClubs]) => ({
    league,
    clubs: leagueClubs.filter(c => availableClubs.includes(c))
  })).filter(group => group.clubs.length > 0);

  // Adicionar "Outros" para clubes que não estão no dicionário, se houver
  const knownClubs = new Set(Object.values(CLUBS_BY_LEAGUE).flat());
  const otherClubs = availableClubs.filter(c => !knownClubs.has(c));
  if (otherClubs.length > 0) {
    groupedClubs.push({ league: "Outras Ligas", clubs: otherClubs });
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">Mudar de Clube</h2>
      <p className="text-sm text-muted-foreground">
        Selecione um novo clube para gerenciar. Seu histórico global será mantido.
      </p>

      <div className="space-y-8">
        {groupedClubs.map(({ league, clubs }) => (
          <div key={league} className="space-y-4">
            <h3 className="font-display text-lg font-semibold flex items-center gap-2 border-b border-border pb-2">
              <Trophy size={18} className="text-primary" />
              {league}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {clubs.map((club) => (
                <button
                  key={club}
                  onClick={() => setSelected(club)}
                  className={`card-gamer p-4 flex items-center gap-3 transition-all text-left ${
                    selected === club
                      ? "border-primary glow-primary bg-primary/5"
                      : "hover:border-muted-foreground/30"
                  }`}
                >
                  <Shield size={20} className={selected === club ? "text-primary" : "text-muted-foreground"} />
                  <span className="font-medium text-sm truncate">{club}</span>
                  {selected === club && <Check size={16} className="text-primary ml-auto flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="card-gamer p-5 space-y-4">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Novo clube</p>
            <p className="font-display text-lg font-bold">{selected}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block tracking-wider">
                Competição Europeia
              </label>
              <select
                value={europeanCompetitionId}
                onChange={(e) => setEuropeanCompetitionId(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow appearance-none"
              >
                <option value="none">Nenhuma</option>
                {europeanCompetitions.map((competition) => (
                  <option key={competition.id} value={competition.id}>{competition.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block tracking-wider">
                Orçamento
              </label>
              <input
                type="text"
                value={budgetInput}
                onChange={(e) => {
                  setBudgetInput(e.target.value);
                  if (budgetError) setBudgetError("");
                }}
                onBlur={handleBudgetBlur}
                placeholder="Ex: 100"
                className={`w-full bg-background border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 transition-shadow ${budgetError ? "border-destructive focus:ring-destructive/50" : "border-border focus:ring-primary/50"}`}
              />
              <p className="text-xs text-muted-foreground mt-1.5">Digite o valor em milhões. Ex.: 100 = 100M.</p>
              {budgetError && <p className="text-xs text-destructive mt-1.5 font-medium">{budgetError}</p>}
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md font-display font-semibold text-sm hover:opacity-90 transition-opacity animate-pulse-glow disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? "Transferindo..." : `Assinar com ${selected}`}
          </button>
        </div>
      )}
    </div>
  );
};

export default ChangeClubScreen;
