import { useState, type ReactNode } from "react";
import { ArrowRight, CheckCircle2, ChevronLeft, Loader2, LogOut, Plus, Shield, Sparkles, Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { extractErrorMessage, type ApiSave, type UserPlan } from "@/services/api";
import { useClubsByLeague } from "@/hooks/useClubs";
import { useEuropeanCompetitions } from "@/hooks/useCompetitions";
import { useDeleteSave } from "@/hooks/useSaves";
import { parseBudgetInMillionsInput } from "@/utils/currency";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import SaveSelectTutorial from "@/components/tutorial/SaveSelectTutorial";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  userName: string;
  userPlan: UserPlan;
  saves: ApiSave[];
  loading: boolean;
  onSelectSave: (save: ApiSave) => void;
  onCreateSave: (name: string, club: string, budget: string, europeanCompetitionId: string | null) => Promise<void>;
  onSignOut: () => void;
  creating: boolean;
}

const planSaveLimit: Partial<Record<UserPlan, number>> = {
  FREE: 3,
};

const formatUpdatedAt = (value?: string) => {
  if (!value) return "Sem data recente";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem data recente";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const SaveSelect = ({ userName, userPlan, saves, loading, onSelectSave, onCreateSave, onSignOut, creating }: Props) => {
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
  const saveLimit = planSaveLimit[userPlan];
  const saveCountLabel = saveLimit ? `${saves.length}/${saveLimit} saves` : `${saves.length} saves`;

  const resetForm = () => {
    setShowForm(false);
    setNewName("");
    setNewLeague("");
    setNewClub("");
    setNewBudget("");
    setNewEuropeanCompetitionId("none");
    setBudgetError("");
  };

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
    if (!newName.trim() || !newClub) return;
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
      resetForm();
    } catch {
      // A mensagem de erro ja e exibida no fluxo de criacao.
    }
  };

  const canCreate = !!newName.trim() && !!newClub && parseBudgetInMillionsInput(newBudget) !== null && !creating;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:52px_52px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.16),transparent_34%),radial-gradient(circle_at_78%_12%,hsl(var(--accent)/0.12),transparent_30%)]" />

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 px-6 backdrop-blur-sm">
          <div className="card-gamer flex min-w-[280px] flex-col items-center gap-4 p-8 text-center">
            <Loader2 size={28} className="animate-spin text-primary" />
            <div className="space-y-1">
              <p className="font-display text-lg font-bold text-foreground">Preparando seu save</p>
              <p className="text-sm text-muted-foreground">Criando a carreira e abrindo o dashboard...</p>
            </div>
          </div>
        </div>
      )}

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header data-tour="save-header" className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary shadow-[0_0_24px_hsl(var(--primary)/0.16)]">
              <Shield size={22} />
            </div>
            <div>
              <p className="font-display text-xs font-bold uppercase tracking-[0.22em] text-primary">FC Career Hub</p>
              <h1 className="font-display text-3xl font-bold leading-none tracking-tight sm:text-4xl">Suas carreiras</h1>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div data-tour="save-user-summary" className="rounded-lg border border-border bg-card/70 px-4 py-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{userName}</span>
              <span className="mx-2 text-border">/</span>
              <span>Plano {userPlan}</span>
              <span className="mx-2 text-border">/</span>
              <span>{saveCountLabel}</span>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card/70 px-4 font-display text-sm font-bold text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              title="Sair e voltar para a tela inicial"
            >
              <LogOut size={16} />
              Sair
            </button>
            <div data-tour="save-help">
              <SaveSelectTutorial />
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-5 py-4 text-muted-foreground">
              <Loader2 size={22} className="animate-spin text-primary" />
              <span className="font-medium">Carregando saves...</span>
            </div>
          </div>
        ) : showForm ? (
          <CreateSavePanel
            budgetError={budgetError}
            canCreate={canCreate}
            clubsForLeague={clubsForLeague}
            creating={creating}
            europeanCompetitions={europeanCompetitions}
            leagueNames={leagueNames}
            newBudget={newBudget}
            newClub={newClub}
            newEuropeanCompetitionId={newEuropeanCompetitionId}
            newLeague={newLeague}
            newName={newName}
            onBudgetBlur={handleBudgetBlur}
            onCancel={resetForm}
            onCreate={handleCreate}
            onEuropeanCompetitionChange={setNewEuropeanCompetitionId}
            onBudgetChange={(value) => {
              setNewBudget(value);
              setBudgetError("");
            }}
            onClubChange={setNewClub}
            onLeagueChange={(value) => {
              setNewLeague(value);
              setNewClub("");
            }}
            onNameChange={setNewName}
          />
        ) : saves.length === 0 ? (
          <EmptyState onCreate={() => setShowForm(true)} />
        ) : (
          <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-8">
            <div className="mb-6">
              <p className="font-display text-xl font-bold leading-none">Escolha um save</p>
              <p className="mt-1 text-sm text-muted-foreground">Abra uma carreira existente ou crie uma nova jornada.</p>
            </div>

            <Carousel
              data-tour="save-list"
              opts={{
                align: "start",
                containScroll: "trimSnaps",
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4 py-1">
                {saves.map((save) => (
                  <CarouselItem key={save.id} className="basis-full pl-4 sm:basis-[78%] md:basis-1/2 lg:basis-1/3">
                    <SaveCard
                      save={save}
                      onSelectSave={onSelectSave}
                      onDelete={(selectedSave) => {
                        if (confirm(`Deletar o save "${selectedSave.name}"? Esta ação não pode ser desfeita.`)) {
                          deleteSave.mutate(selectedSave.id, {
                            onError: (error) => {
                              toast.error(extractErrorMessage(error), { duration: 5000 });
                            },
                          });
                        }
                      }}
                      deleting={deleteSave.isPending}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="-left-4 border-border bg-card text-foreground hover:bg-primary hover:text-primary-foreground disabled:hidden md:-left-12" />
              <CarouselNext className="-right-4 border-border bg-card text-foreground hover:bg-primary hover:text-primary-foreground disabled:hidden md:-right-12" />
            </Carousel>

            <button
              data-tour="save-create-action"
              onClick={() => setShowForm(true)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-card/45 px-5 py-5 font-display text-lg font-bold text-primary transition-colors hover:border-primary/60 hover:bg-primary/5"
            >
              <Plus size={22} />
              Criar novo save
            </button>
          </section>
        )}
      </main>
    </div>
  );
};

interface SaveCardProps {
  save: ApiSave;
  onSelectSave: (save: ApiSave) => void;
  onDelete: (save: ApiSave) => void;
  deleting: boolean;
}

const SaveCard = ({ save, onSelectSave, onDelete, deleting }: SaveCardProps) => (
  <article className="group/card relative">
    <button
      onClick={() => onSelectSave(save)}
      className="card-gamer relative min-h-[180px] w-full overflow-hidden p-6 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/80 via-accent/70 to-transparent opacity-70" />
      <h3 className="truncate pr-10 font-display text-2xl font-bold leading-none transition-colors group-hover/card:text-primary">
        {save.name}
      </h3>

      <div className="mt-5 space-y-3">
        <p className="flex items-center gap-2 truncate text-sm text-muted-foreground">
          <Shield size={16} className="shrink-0 text-primary/80" />
          <span className="font-medium text-foreground">{save.currentClubStint?.club ?? "Clube indefinido"}</span>
        </p>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Trophy size={16} className="shrink-0 text-muted-foreground/80" />
          <span>Temporada {save.currentSeason}</span>
        </p>
      </div>

      <div className="mt-5">
        <MiniStat label="Atualizado" value={formatUpdatedAt(save.updatedAt ?? save.createdAt)} />
      </div>

      <span className="mt-5 inline-flex items-center gap-2 font-display text-sm font-bold text-primary">
        Abrir carreira
        <ArrowRight size={16} />
      </span>
    </button>

    <button
      onClick={() => onDelete(save)}
      disabled={deleting}
      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
      title="Deletar save"
    >
      {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
    </button>
  </article>
);

interface CreateSavePanelProps {
  budgetError: string;
  canCreate: boolean;
  clubsForLeague: string[];
  creating: boolean;
  europeanCompetitions: Array<{ id: string; name: string }>;
  leagueNames: string[];
  newBudget: string;
  newClub: string;
  newEuropeanCompetitionId: string;
  newLeague: string;
  newName: string;
  onBudgetBlur: () => void;
  onBudgetChange: (value: string) => void;
  onCancel: () => void;
  onClubChange: (value: string) => void;
  onCreate: () => void;
  onEuropeanCompetitionChange: (value: string) => void;
  onLeagueChange: (value: string) => void;
  onNameChange: (value: string) => void;
}

const CreateSavePanel = ({
  budgetError,
  canCreate,
  clubsForLeague,
  creating,
  europeanCompetitions,
  leagueNames,
  newBudget,
  newClub,
  newEuropeanCompetitionId,
  newLeague,
  newName,
  onBudgetBlur,
  onBudgetChange,
  onCancel,
  onClubChange,
  onCreate,
  onEuropeanCompetitionChange,
  onLeagueChange,
  onNameChange,
}: CreateSavePanelProps) => (
  <section className="grid flex-1 gap-6 py-8 lg:grid-cols-[360px_minmax(0,1fr)]">
    <aside className="card-gamer h-fit p-5">
      <button onClick={onCancel} className="mb-5 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ChevronLeft size={16} />
        Voltar para carreiras
      </button>
      <p className="font-display text-3xl font-bold leading-none">Nova carreira</p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Defina a base do save uma vez. O resto da história começa no dashboard.
      </p>
      <div className="mt-6 space-y-3">
        <Step done={!!newName.trim()} label="Identidade" />
        <Step done={!!newClub} label="Clube inicial" />
        <Step done={parseBudgetInMillionsInput(newBudget) !== null} label="Orçamento" />
        <Step done label="Competição opcional" />
      </div>
    </aside>

    <div data-tour="save-form" className="card-gamer p-5 sm:p-7">
      <div className="grid gap-5">
        <Field label="Nome do save">
          <input
            type="text"
            value={newName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Ex: A Dinastia"
            className="h-12 w-full rounded-lg border border-border bg-background/70 px-4 text-sm text-foreground outline-none transition-shadow placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/50"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Liga">
            <Select
              value={newLeague}
              onValueChange={(value) => {
                onLeagueChange(value);
                onClubChange("");
              }}
            >
              <SelectTrigger className="h-12 rounded-lg border-border bg-background/70 px-4 font-display text-sm font-semibold text-foreground transition-shadow hover:border-primary/40 focus:ring-primary/50 focus:ring-offset-0">
                <SelectValue placeholder="Selecione a liga..." />
              </SelectTrigger>
              <SelectContent className="border-border bg-card text-foreground shadow-[0_18px_48px_hsl(220_20%_3%/0.55)]">
                {leagueNames.map((league) => (
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
          </Field>

          <Field label="Clube inicial">
            <Select
              value={newClub}
              disabled={!newLeague}
              onValueChange={onClubChange}
            >
              <SelectTrigger className="h-12 rounded-lg border-border bg-background/70 px-4 font-display text-sm font-semibold text-foreground transition-shadow hover:border-primary/40 focus:ring-primary/50 focus:ring-offset-0">
                <SelectValue placeholder="Selecione o time..." />
              </SelectTrigger>
              <SelectContent className="border-border bg-card text-foreground shadow-[0_18px_48px_hsl(220_20%_3%/0.55)]">
                {clubsForLeague.map((club) => (
                  <SelectItem
                    key={club}
                    value={club}
                    className="font-display text-sm font-semibold focus:bg-primary focus:text-primary-foreground"
                  >
                    {club}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Orçamento inicial">
            <input
              type="text"
              value={newBudget}
              onChange={(e) => onBudgetChange(e.target.value)}
              onBlur={onBudgetBlur}
              placeholder="Ex: 100"
              className={`h-12 w-full rounded-lg border bg-background/70 px-4 text-sm text-foreground outline-none transition-shadow placeholder:text-muted-foreground/50 focus:ring-2 ${
                budgetError ? "border-destructive focus:ring-destructive/50" : "border-border focus:ring-primary/50"
              }`}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">Digite em milhões. Ex.: 100 = 100M.</p>
            {budgetError && <p className="mt-1.5 text-xs font-medium text-destructive">{budgetError}</p>}
          </Field>

          <Field label="Competição europeia inicial">
            <Select
              value={newEuropeanCompetitionId}
              onValueChange={onEuropeanCompetitionChange}
            >
              <SelectTrigger className="h-12 rounded-lg border-border bg-background/70 px-4 font-display text-sm font-semibold text-foreground transition-shadow hover:border-primary/40 focus:ring-primary/50 focus:ring-offset-0">
                <SelectValue placeholder="Nenhuma" />
              </SelectTrigger>
              <SelectContent className="border-border bg-card text-foreground shadow-[0_18px_48px_hsl(220_20%_3%/0.55)]">
                <SelectItem value="none" className="font-display text-sm font-semibold focus:bg-primary focus:text-primary-foreground">
                  Nenhuma
                </SelectItem>
                {europeanCompetitions.map((competition) => (
                  <SelectItem
                    key={competition.id}
                    value={competition.id}
                    className="font-display text-sm font-semibold focus:bg-primary focus:text-primary-foreground"
                  >
                    {competition.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1.5 text-xs text-muted-foreground">Opcional para a primeira temporada.</p>
          </Field>
        </div>

        <div className="mt-2 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
          <button
            onClick={onCancel}
            className="rounded-lg border border-border bg-background/50 px-5 py-3 font-display text-sm font-bold text-foreground transition-colors hover:border-primary/40"
          >
            Cancelar
          </button>
          <button
            onClick={onCreate}
            disabled={!canCreate}
            className="landing-btn-primary flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-display text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
            Iniciar carreira
          </button>
        </div>
      </div>
    </div>
  </section>
);

const EmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <section className="flex flex-1 items-center justify-center py-12">
    <div className="card-gamer max-w-2xl p-8 text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
        <Trophy size={27} />
      </div>
      <h2 className="font-display text-4xl font-bold leading-none">Nenhum save criado ainda</h2>
      <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
        Crie seu primeiro save para registrar temporadas, elenco, mercado, estatísticas e conquistas.
      </p>
      <button
        data-tour="save-create-action"
        onClick={onCreate}
        className="landing-btn-primary mx-auto mt-7 flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-display text-sm font-bold text-primary-foreground"
      >
        <Plus size={18} />
        Criar primeiro save
      </button>
    </div>
  </section>
);

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block">
    <span className="mb-2 block font-display text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
    {children}
  </label>
);

const Step = ({ done, label }: { done: boolean; label: string }) => (
  <div className="flex items-center gap-3 rounded-lg border border-border bg-background/35 px-3 py-2.5">
    <CheckCircle2 size={17} className={done ? "text-primary" : "text-muted-foreground/50"} />
    <span className={`font-display text-sm font-bold ${done ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
  </div>
);

const MiniStat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md border border-border/80 bg-background/35 px-3 py-2">
    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
    <p className="mt-1 truncate font-display text-sm font-bold text-foreground">{value}</p>
  </div>
);

export default SaveSelect;
