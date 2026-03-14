import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { type ApiPlayer, extractErrorMessage } from "@/services/api";
import { useUpdatePlayerStats } from "@/hooks/usePlayers";
import { normalizeCurrencyInput } from "@/utils/currency";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: ApiPlayer | null;
  onSave: (data: any, playerId?: string) => Promise<void>;
  saveId: string;
}

const emptyForm = {
  name: "", position: "MEI" as string, age: 20, status: "Important" as string, ovr: 70,
  salary: "", marketValue: "",
  goals: 0, assists: 0, yellowCards: 0, redCards: 0, matches: 0,
};

const PlayerModal = ({ open, onOpenChange, player, onSave, saveId }: Props) => {
  const [form, setForm] = useState(emptyForm);
  const isEdit = !!player;
  const updateStats = useUpdatePlayerStats();

  useEffect(() => {
    if (player) {
      const stats = player.seasonStats || player.totalStats;
      setForm({
        name: player.name,
        position: player.position,
        age: player.age,
        status: player.status,
        ovr: player.ovr,
        salary: player.salary ?? "",
        marketValue: player.marketValue ?? "",
        goals: stats?.goals ?? 0,
        assists: stats?.assists ?? 0,
        yellowCards: stats?.yellowCards ?? 0,
        redCards: stats?.redCards ?? 0,
        matches: stats?.matches ?? 0,
      });
    } else {
      setForm(emptyForm);
    }
  }, [player, open]);

  const handleCurrencyBlur = (field: "salary" | "marketValue") => {
    const normalized = normalizeCurrencyInput(form[field]);
    setForm((prev) => ({ ...prev, [field]: normalized }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const salary = normalizeCurrencyInput(form.salary);
    const marketValue = normalizeCurrencyInput(form.marketValue);

    try {
      await onSave({ ...form, salary, marketValue }, player?.id);

      if (player) {
        const stats = player.seasonStats || player.totalStats;
        const statsChanged =
          form.goals !== (stats?.goals ?? 0) ||
          form.assists !== (stats?.assists ?? 0) ||
          form.yellowCards !== (stats?.yellowCards ?? 0) ||
          form.redCards !== (stats?.redCards ?? 0) ||
          form.matches !== (stats?.matches ?? 0);
        
        if (statsChanged) {
          await updateStats.mutateAsync({
            saveId,
            playerId: player.id,
            data: { goals: form.goals, assists: form.assists, yellowCards: form.yellowCards, redCards: form.redCards, matches: form.matches },
          });
          toast.success("Estatísticas atualizadas!", { duration: 3000 });
        }
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(extractErrorMessage(err), { duration: 5000 });
    }
  };

  const inputClass = "w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary";
  const labelClass = "text-xs text-muted-foreground uppercase mb-1 block";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">{isEdit ? "Editar Jogador" : "Adicionar Jogador"}</DialogTitle>
          <DialogDescription>Preencha os dados do jogador.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className={labelClass}>Nome</label>
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Posição</label>
              <select className={inputClass} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
                <option value="GOL">GOL</option>
                <option value="ZAG">ZAG</option>
                <option value="MEI">MEI</option>
                <option value="ATA">ATA</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="Crucial">Crucial</option>
                <option value="Important">Importante</option>
                <option value="Role">Rotação</option>
                <option value="Sporadic">Esporádico</option>
                <option value="Promising">Promissor</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Idade</label>
              <input type="number" className={inputClass} value={form.age} onChange={(e) => setForm({ ...form, age: +e.target.value })} min={15} max={45} />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className={labelClass}>OVR</label>
              <input type="number" className={inputClass} value={form.ovr} onChange={(e) => setForm({ ...form, ovr: +e.target.value })} min={40} max={99} />
            </div>
            <div>
              <label className={labelClass}>Partidas</label>
              <input type="number" className={inputClass} value={form.matches} onChange={(e) => setForm({ ...form, matches: +e.target.value })} min={0} />
            </div>
            <div>
              <label className={labelClass}>Gols</label>
              <input type="number" className={inputClass} value={form.goals} onChange={(e) => setForm({ ...form, goals: +e.target.value })} min={0} />
            </div>
            <div>
              <label className={labelClass}>Assist.</label>
              <input type="number" className={inputClass} value={form.assists} onChange={(e) => setForm({ ...form, assists: +e.target.value })} min={0} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Salário</label>
              <input
                className={inputClass}
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                onBlur={() => handleCurrencyBlur("salary")}
                placeholder="€50K"
              />
            </div>
            <div>
              <label className={labelClass}>Valor de Mercado</label>
              <input
                className={inputClass}
                value={form.marketValue}
                onChange={(e) => setForm({ ...form, marketValue: e.target.value })}
                onBlur={() => handleCurrencyBlur("marketValue")}
                placeholder="€10M"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Cartões Amarelos</label>
              <input type="number" className={inputClass} value={form.yellowCards} onChange={(e) => setForm({ ...form, yellowCards: +e.target.value })} min={0} />
            </div>
            <div>
              <label className={labelClass}>Cartões Vermelhos</label>
              <input type="number" className={inputClass} value={form.redCards} onChange={(e) => setForm({ ...form, redCards: +e.target.value })} min={0} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="bg-primary text-primary-foreground px-5 py-2 rounded-md font-display font-semibold text-sm hover:opacity-90 transition-opacity">
              {isEdit ? "Salvar" : "Adicionar"}
            </button>
            <button type="button" onClick={() => onOpenChange(false)} className="bg-muted text-muted-foreground px-5 py-2 rounded-md text-sm hover:text-foreground transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerModal;
