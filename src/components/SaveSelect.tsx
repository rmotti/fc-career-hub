import { useState } from "react";
import { Plus, Gamepad2, Shield, Calendar, Trophy, Loader2, ClipboardList, BarChart2, Trash2 } from "lucide-react";
import type { ApiSave } from "@/services/api";
import { useClubsByLeague } from "@/hooks/useClubs";
import { useDeleteSave } from "@/hooks/useSaves";

interface Props {
  saves: ApiSave[];
  loading: boolean;
  onSelectSave: (save: ApiSave) => void;
  onCreateSave: (name: string, club: string, budget: string) => void;
  creating: boolean;
}

const SaveSelect = ({ saves, loading, onSelectSave, onCreateSave, creating }: Props) => {
  const [showForm, setShowForm] = useState(false);
  const deleteSave = useDeleteSave();
  const [newName, setNewName] = useState("");
  const [newLeague, setNewLeague] = useState("");
  const [newClub, setNewClub] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [budgetError, setBudgetError] = useState("");
  const { data: clubsByLeague = {} } = useClubsByLeague();

  const leagueNames = Object.keys(clubsByLeague);
  const clubsForLeague: string[] = newLeague ? (clubsByLeague[newLeague] ?? []) : [];

  const handleBudgetBlur = () => {
    const num = parseFloat(newBudget);
    if (isNaN(num) || num < 0) {
      setBudgetError("Orçamento deve ser um número válido (ex: 85000000)");
    } else {
      setBudgetError("");
    }
  };

  const handleCreate = () => {
    const num = parseFloat(newBudget);
    if (!newName.trim()) return;
    if (!newClub) return;
    if (isNaN(num) || num < 0) {
      setBudgetError("Orçamento obrigatório e deve ser um número válido");
      return;
    }
    setBudgetError("");
    // Pass as string to onCreateSave since it expects a string, but it's a valid float string
    onCreateSave(newName.trim(), newClub, num.toString());
    setShowForm(false);
    setNewName("");
    setNewLeague("");
    setNewClub("");
    setNewBudget("");
  };

  const userName = "Jogador";

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6 pb-12 w-full max-w-5xl mx-auto space-y-16 py-12">
      
      {/* 1. Header / Hero */}
      <section className="text-center w-full mt-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Gamepad2 size={36} className="text-primary" />
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
            FC 26 <span className="text-primary text-glow-primary">HUB</span>
          </h1>
        </div>
        <p className="text-muted-foreground text-lg sm:text-xl font-medium mb-1">Gerencie seus saves do Modo Carreira</p>
        <p className="text-muted-foreground/60 text-sm">Olá, {userName} 👋</p>
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
                        deleteSave.mutate(save.id);
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
                  placeholder="Ex: 85000000"
                  className={`w-full bg-background border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 transition-shadow ${budgetError ? "border-destructive focus:ring-destructive/50" : "border-border focus:ring-primary/50"}`}
                />
                {budgetError && <p className="text-xs text-destructive mt-1.5 font-medium">{budgetError}</p>}
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
                onClick={() => { setShowForm(false); setNewLeague(""); setNewClub(""); setBudgetError(""); }}
                className="flex-1 bg-muted text-foreground py-3 rounded-lg font-medium text-sm hover:bg-muted/80 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 3. O que é o FC 26 Hub */}
      <section className="w-full text-center space-y-8">
        <h2 className="font-display text-3xl font-bold">O que é o FC 26 Hub?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="card-gamer p-6 bg-card/50">
            <div className="text-primary mb-4 bg-primary/10 w-fit p-3 rounded-xl"><ClipboardList size={28} /></div>
            <h3 className="font-display text-xl font-bold mb-2">Registre sua carreira</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">Acompanhe cada temporada, clube gerenciado e conquistas do seu Modo Carreira ao longo dos anos.</p>
          </div>
          <div className="card-gamer p-6 bg-card/50">
            <div className="text-primary mb-4 bg-primary/10 w-fit p-3 rounded-xl"><BarChart2 size={28} /></div>
            <h3 className="font-display text-xl font-bold mb-2">Estatísticas completas</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">Gols, assistências, partidas, cartões e muito mais documentados por jogador e consolidados por temporada.</p>
          </div>
          <div className="card-gamer p-6 bg-card/50">
            <div className="text-primary mb-4 bg-primary/10 w-fit p-3 rounded-xl"><Trophy size={28} /></div>
            <h3 className="font-display text-xl font-bold mb-2">Histórico de troféus</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">Guarde cada título conquistado, com clube e temporada registrados na sua sala de troféus pessoal.</p>
          </div>
        </div>
      </section>

      {/* 4. Como funciona (4 steps) */}
      <section className="w-full bg-card/30 border border-border p-8 sm:p-12 rounded-2xl">
        <h2 className="font-display text-3xl font-bold text-center mb-10">Como funciona</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          {/* Connector line for desktop */}
          <div className="hidden md:block absolute top-6 left-[10%] right-[10%] h-0.5 bg-border/60 z-0"></div>
          
          {[
            { tag: "1", title: "Crie um Save", desc: "Dê um nome à sua carreira, escolha seu clube e defina o orçamento." },
            { tag: "2", title: "Monte seu elenco", desc: "Adicione jogadores com posição, overall, salário e valor de mercado." },
            { tag: "3", title: "Registre a temporada", desc: "Atualize estatísticas de jogadores e do time ao longo da temporada." },
            { tag: "4", title: "Avance e conquiste", desc: "Finalize temporadas, registre transferências e conquiste troféus." },
          ].map((step, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-card border-2 border-primary text-primary font-display font-bold text-xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                {step.tag}
              </div>
              <h4 className="font-display text-lg font-bold mb-2">{step.title}</h4>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="w-full text-center pt-8 border-t border-border/50">
        <p className="text-sm text-muted-foreground/60 font-medium">FC 26 Hub · Feito para jogadores de Modo Carreira</p>
      </footer>
    </div>
  );
};

export default SaveSelect;
