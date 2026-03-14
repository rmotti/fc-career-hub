import { useState } from "react";
import { Plus, Gamepad2, Shield, Calendar, Trophy, Loader2 } from "lucide-react";
import type { ApiSave } from "@/services/api";
import { useClubs } from "@/hooks/useClubs";
import { normalizeCurrencyInput, isValidCurrencyFormat } from "@/utils/currency";

interface Props {
  saves: ApiSave[];
  loading: boolean;
  onSelectSave: (save: ApiSave) => void;
  onCreateSave: (name: string, club: string, budget: string) => void;
  creating: boolean;
}

const SaveSelect = ({ saves, loading, onSelectSave, onCreateSave, creating }: Props) => {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newClub, setNewClub] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [budgetError, setBudgetError] = useState("");
  const { data: clubs = [] } = useClubs();

  // Set default club when clubs load
  if (clubs.length > 0 && !newClub) {
    setNewClub(clubs[0]);
  }

  const handleBudgetBlur = () => {
    const normalized = normalizeCurrencyInput(newBudget);
    setNewBudget(normalized);
    if (normalized && !isValidCurrencyFormat(normalized)) {
      setBudgetError("Formato inválido. Use €XK ou €XM (ex: €85M)");
    } else {
      setBudgetError("");
    }
  };

  const handleCreate = () => {
    const budget = normalizeCurrencyInput(newBudget);
    if (!newName.trim()) return;
    if (!newClub) return;
    if (!budget || !isValidCurrencyFormat(budget)) {
      setBudgetError("Orçamento obrigatório no formato €XK ou €XM");
      return;
    }
    setBudgetError("");
    onCreateSave(newName.trim(), newClub, budget);
    setShowForm(false);
    setNewName("");
    setNewBudget("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Gamepad2 size={32} className="text-primary" />
            <h1 className="font-display text-4xl font-bold tracking-tight">
              FC 26 <span className="text-primary text-glow-primary">HUB</span>
            </h1>
          </div>
          <p className="text-muted-foreground">Gerencie seus saves do Modo Carreira</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground py-12">
            <Loader2 size={20} className="animate-spin" />
            <span>Carregando saves...</span>
          </div>
        ) : !showForm ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {saves.map((save) => (
                <button
                  key={save.id}
                  onClick={() => onSelectSave(save)}
                  className="card-gamer p-5 text-left hover:border-primary/40 transition-all group"
                >
                  <h3 className="font-display text-lg font-bold group-hover:text-primary transition-colors">
                    {save.name}
                  </h3>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield size={14} className="text-primary" />
                      <span>{save.currentClubStint?.club ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar size={14} />
                      <span>Temporada {save.currentSeason}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="w-full card-gamer p-4 flex items-center justify-center gap-2 text-primary hover:border-primary/40 transition-all font-display font-semibold"
            >
              <Plus size={20} />
              Criar Novo Save
            </button>
          </>
        ) : (
          <div className="card-gamer p-6 space-y-4">
            <h3 className="font-display text-lg font-semibold">Novo Save</h3>
            <div>
              <label className="text-xs text-muted-foreground uppercase mb-1 block">Nome do Save</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: A Dinastia"
                className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase mb-1 block">Time Inicial</label>
              <select
                value={newClub}
                onChange={(e) => setNewClub(e.target.value)}
                className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {clubs.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase mb-1 block">Orçamento inicial</label>
              <input
                type="text"
                value={newBudget}
                onChange={(e) => { setNewBudget(e.target.value); setBudgetError(""); }}
                onBlur={handleBudgetBlur}
                placeholder="Ex: €85M"
                className={`w-full bg-muted border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary ${budgetError ? "border-destructive" : "border-border"}`}
              />
              {budgetError && <p className="text-xs text-destructive mt-1">{budgetError}</p>}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={creating}
                className="bg-primary text-primary-foreground px-5 py-2 rounded-md font-display font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {creating ? "Criando..." : "Criar"}
              </button>
              <button
                onClick={() => { setShowForm(false); setBudgetError(""); }}
                className="bg-muted text-muted-foreground px-5 py-2 rounded-md text-sm hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaveSelect;
