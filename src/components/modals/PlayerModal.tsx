import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Player } from "@/data/mockData";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: Player | null;
  onSave: (player: Player) => void;
}

const emptyPlayer: Omit<Player, "id"> = {
  name: "", position: "MEI", age: 20, ovr: 70,
  goals: 0, assists: 0, salary: "€10K", marketValue: "€1M",
  yellowCards: 0, redCards: 0,
};

const PlayerModal = ({ open, onOpenChange, player, onSave }: Props) => {
  const [form, setForm] = useState<Omit<Player, "id">>(emptyPlayer);
  const isEdit = !!player;

  useEffect(() => {
    if (player) {
      const { id, ...rest } = player;
      setForm(rest);
    } else {
      setForm(emptyPlayer);
    }
  }, [player, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, id: player?.id ?? Date.now() });
    onOpenChange(false);
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Posição</label>
              <select className={inputClass} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value as Player["position"] })}>
                <option value="GOL">GOL</option>
                <option value="ZAG">ZAG</option>
                <option value="MEI">MEI</option>
                <option value="ATA">ATA</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Idade</label>
              <input type="number" className={inputClass} value={form.age} onChange={(e) => setForm({ ...form, age: +e.target.value })} min={15} max={45} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>OVR</label>
              <input type="number" className={inputClass} value={form.ovr} onChange={(e) => setForm({ ...form, ovr: +e.target.value })} min={40} max={99} />
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
              <input className={inputClass} value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} placeholder="€50K" />
            </div>
            <div>
              <label className={labelClass}>Valor de Mercado</label>
              <input className={inputClass} value={form.marketValue} onChange={(e) => setForm({ ...form, marketValue: e.target.value })} placeholder="€10M" />
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
