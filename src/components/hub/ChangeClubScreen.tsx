import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Loader2,
  Search,
  Shield,
  Trophy,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useClubs } from "@/hooks/useClubs";
import { useEuropeanCompetitions } from "@/hooks/useCompetitions";
import { useChangeClub } from "@/hooks/useClubStints";
import { useUpdateSave } from "@/hooks/useSaves";
import { extractErrorMessage } from "@/services/api";
import { parseBudgetInMillionsInput } from "@/utils/currency";
import { CLUBS_BY_LEAGUE } from "@/utils/leagues";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  saveId: string;
  currentClub: string;
}

const ALL_LEAGUES = "Todas";

const ChangeClubScreen = ({ saveId, currentClub }: Props) => {
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [contractClub, setContractClub] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeLeague, setActiveLeague] = useState(ALL_LEAGUES);
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
    if (!contractClub) return;

    const budget = parseBudgetInMillionsInput(budgetInput);
    if (budget === null) {
      setBudgetError("Orçamento obrigatório e deve ser um número válido em milhões");
      return;
    }

    try {
      await changeClub.mutateAsync({ saveId, club: contractClub });
      await updateSave.mutateAsync({
        saveId,
        data: {
          budget: String(budget),
          europeanCompetitionId: europeanCompetitionId === "none" ? null : europeanCompetitionId,
        },
      });

      toast.success(`Agora você gerencia o ${contractClub}!`, { duration: 3000 });
      navigate("/dashboard");
    } catch (err) {
      toast.error(extractErrorMessage(err), { duration: 5000 });
    }
  };

  const isSubmitting = changeClub.isPending || updateSave.isPending;
  const parsedBudget = parseBudgetInMillionsInput(budgetInput);
  const selectedCompetition = europeanCompetitions.find((competition) => competition.id === europeanCompetitionId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
        <Loader2 size={20} className="animate-spin" /> Carregando clubes...
      </div>
    );
  }

  const availableClubs = allClubs.filter(c => c !== currentClub);

  const groupedClubsBase = Object.entries(CLUBS_BY_LEAGUE).map(([league, leagueClubs]) => ({
    league,
    clubs: leagueClubs.filter(c => availableClubs.includes(c))
  })).filter(group => group.clubs.length > 0);

  const knownClubs = new Set(Object.values(CLUBS_BY_LEAGUE).flat());
  const otherClubs = availableClubs.filter(c => !knownClubs.has(c));
  if (otherClubs.length > 0) {
    groupedClubsBase.push({ league: "Outras Ligas", clubs: otherClubs });
  }

  const leagueOptions = [ALL_LEAGUES, ...groupedClubsBase.map((group) => group.league)];
  const normalizedSearch = search.trim().toLowerCase();
  const groupedClubs = groupedClubsBase
    .filter((group) => activeLeague === ALL_LEAGUES || group.league === activeLeague)
    .map((group) => ({
      ...group,
      clubs: group.clubs.filter((club) => club.toLowerCase().includes(normalizedSearch)),
    }))
    .filter((group) => group.clubs.length > 0);
  const visibleClubCount = groupedClubs.reduce((sum, group) => sum + group.clubs.length, 0);

  const openContract = (club: string) => {
    setSelectedClub(club);
    setContractClub(club);
    setBudgetInput("");
    setBudgetError("");
    setEuropeanCompetitionId("none");
  };

  const closeContract = (open: boolean) => {
    if (!open && !isSubmitting) {
      setContractClub(null);
      setBudgetError("");
    }
  };

  const clearSelection = () => {
    if (isSubmitting) return;

    setSelectedClub(null);
    setContractClub(null);
    setBudgetInput("");
    setBudgetError("");
    setEuropeanCompetitionId("none");
  };

  return (
    <>
      <div className="space-y-6">
        <section data-tour="change-club-hero" className="card-gamer relative overflow-hidden p-5 md:p-6">
          <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative grid gap-5 lg:grid-cols-[1fr_0.95fr] lg:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <BriefcaseBusiness size={14} />
                Mercado de oportunidades
              </div>
              <h2 className="font-display text-3xl font-bold leading-none tracking-tight text-foreground md:text-4xl">
                Escolha seu próximo clube
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Você pode mudar no meio da carreira. O histórico global fica salvo, e o novo clube começa um ciclo próprio de elenco, estatísticas e transferências.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <ClubStatusCard label="Clube atual" club={currentClub} tone="muted" />
              <div className="hidden h-9 w-9 items-center justify-center rounded-md border border-border bg-background/30 text-muted-foreground sm:flex">
                <ArrowRight size={17} />
              </div>
              <ClubStatusCard
                label="Próximo destino"
                club={selectedClub ?? "Nenhum clube escolhido"}
                tone={selectedClub ? "primary" : "empty"}
                onClear={selectedClub ? clearSelection : undefined}
              />
            </div>
          </div>
        </section>

        <section data-tour="change-club-filters" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)_180px]">
          <div className="card-gamer p-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Buscar clube
            </label>
            <div className="relative">
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Digite o nome do clube"
                className="h-11 w-full rounded-md border border-border bg-background/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 transition-shadow focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="card-gamer p-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Liga
            </label>
            <Select
              value={activeLeague}
              onValueChange={setActiveLeague}
            >
              <SelectTrigger className="h-11 w-full border-border bg-background/50 font-display text-sm font-semibold text-foreground shadow-none transition-colors hover:border-primary/35 focus:ring-primary/30">
                <SelectValue placeholder="Selecione uma liga" />
              </SelectTrigger>
              <SelectContent className="max-h-72 border-border bg-card font-display text-foreground">
                {leagueOptions.map((league) => (
                  <SelectItem
                    key={league}
                    value={league}
                    className="font-display text-sm font-semibold focus:bg-primary focus:text-primary-foreground"
                  >
                    {league}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="card-gamer p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clubes visíveis</p>
            <p className="mt-2 font-display text-3xl font-bold leading-none text-primary">{visibleClubCount}</p>
          </div>
        </section>

        {groupedClubs.length > 0 ? (
          <div data-tour="change-club-list" className="space-y-8">
            {groupedClubs.map(({ league, clubs }) => (
              <section key={league} className="space-y-4">
                <div className="flex items-center justify-between gap-3 border-b border-border pb-2">
                  <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
                    <Trophy size={18} className="text-primary" />
                    {league}
                  </h3>
                  <span className="rounded-md border border-border bg-muted/20 px-2 py-1 text-xs font-semibold text-muted-foreground">
                    {clubs.length} clubes
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                  {clubs.map((club) => {
                    const isSelected = selectedClub === club;

                    return (
                      <button
                        key={club}
                        type="button"
                        onClick={() => openContract(club)}
                        className={`group card-gamer flex min-h-[82px] items-center gap-3 p-4 text-left transition-all hover:-translate-y-0.5 ${
                          isSelected
                            ? "border-primary/70 bg-primary/5 shadow-[0_0_24px_hsl(var(--primary)/0.14)]"
                            : "hover:border-primary/35"
                        }`}
                      >
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${
                          isSelected
                            ? "border-primary/35 bg-primary/12 text-primary"
                            : "border-border bg-background/35 text-muted-foreground group-hover:text-primary"
                        }`}>
                          <Shield size={19} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-display text-base font-bold leading-none text-foreground">{club}</span>
                          <span className="mt-1.5 block truncate text-xs text-muted-foreground">{league}</span>
                        </span>
                        {isSelected ? (
                          <Check size={17} className="shrink-0 text-primary" />
                        ) : (
                          <ArrowRight size={16} className="shrink-0 text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="card-gamer flex min-h-[180px] flex-col items-center justify-center p-8 text-center">
            <Search size={24} className="text-muted-foreground" />
            <p className="mt-3 font-display text-lg font-bold text-foreground">Nenhum clube encontrado</p>
            <p className="mt-1 text-sm text-muted-foreground">Tente limpar a busca ou trocar o filtro de liga.</p>
          </div>
        )}
      </div>

      <Dialog open={!!contractClub} onOpenChange={closeContract}>
        <DialogContent className="max-w-2xl overflow-hidden p-0">
          <div className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-32 bg-primary/10" />
            <div className="relative border-b border-border bg-card/95 px-5 py-5">
              <DialogHeader>
                <div className="pr-8">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">Contrato de carreira</p>
                    <DialogTitle className="mt-1 truncate font-display text-3xl leading-none text-foreground">
                      Assinar com {contractClub}
                    </DialogTitle>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Informe as condições iniciais antes de abrir o novo ciclo.
                    </p>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="space-y-5 bg-card px-5 py-5">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <ClubStatusCard label="Saindo de" club={currentClub} tone="muted" />
                <div className="hidden h-9 w-9 items-center justify-center rounded-md border border-border bg-background/30 text-primary sm:flex">
                  <ArrowRight size={17} />
                </div>
                <ClubStatusCard label="Chegando em" club={contractClub ?? "Novo clube"} tone="primary" />
              </div>

              <div className="rounded-md border border-[hsl(var(--warning)/0.25)] bg-[hsl(var(--warning)/0.08)] p-4">
                <p className="text-sm font-medium text-foreground">
                  Ao confirmar, seu período no clube atual será encerrado. O histórico global da carreira será mantido, mas o novo clube começará sem elenco registrado.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Competição europeia
                  </label>
                  <select
                    value={europeanCompetitionId}
                    onChange={(e) => setEuropeanCompetitionId(e.target.value)}
                    className="h-11 w-full appearance-none rounded-md border border-border bg-background/50 px-3 text-sm text-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="none">Nenhuma</option>
                    {europeanCompetitions.map((competition) => (
                      <option key={competition.id} value={competition.id}>{competition.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Orçamento inicial
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
                    className={`h-11 w-full rounded-md border bg-background/50 px-3 text-sm text-foreground placeholder:text-muted-foreground/50 transition-shadow focus:outline-none focus:ring-2 ${budgetError ? "border-destructive focus:ring-destructive/50" : "border-border focus:ring-primary/40"}`}
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">Digite em milhões. Ex.: 100 = 100M.</p>
                  {budgetError && <p className="mt-1.5 text-xs font-medium text-destructive">{budgetError}</p>}
                </div>
              </div>

              <div className="rounded-md border border-border bg-background/25 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resumo</p>
                <p className="mt-2 text-sm text-foreground">
                  Você sairá de <span className="font-semibold">{currentClub}</span> e começará no{" "}
                  <span className="font-semibold text-primary">{contractClub}</span>
                  {parsedBudget !== null ? <> com orçamento de <span className="font-semibold">{budgetInput}M</span></> : null}
                  {selectedCompetition ? <> disputando <span className="font-semibold">{selectedCompetition.name}</span></> : null}.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => closeContract(false)}
                  disabled={isSubmitting}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background/40 px-4 font-display text-sm font-semibold text-foreground transition-colors hover:border-primary/35 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 font-display text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {isSubmitting ? "Transferindo..." : `Confirmar mudança`}
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const ClubStatusCard = ({
  label,
  club,
  tone,
  onClear,
}: {
  label: string;
  club: string;
  tone: "primary" | "muted" | "empty";
  onClear?: () => void;
}) => {
  const isPrimary = tone === "primary";
  const isEmpty = tone === "empty";

  return (
    <div className={`rounded-lg border p-4 ${
      isPrimary
        ? "border-primary/35 bg-primary/10"
        : isEmpty
          ? "border-dashed border-border bg-background/20"
          : "border-border bg-background/25"
    }`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${
          isPrimary
            ? "border-primary/35 bg-primary/12 text-primary"
            : "border-border bg-muted/20 text-muted-foreground"
        }`}>
          <Shield size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
          <span className={`mt-1 block truncate font-display text-lg font-bold leading-none ${isEmpty ? "text-muted-foreground" : "text-foreground"}`}>
            {club}
          </span>
        </span>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-primary/25 bg-background/35 text-primary transition-colors hover:bg-primary/10"
            aria-label="Limpar seleção de clube"
            title="Limpar seleção"
          >
            <X size={15} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChangeClubScreen;
