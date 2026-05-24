import { useState, useEffect, useMemo, type FormEvent } from "react";
import type React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { type ApiTransfer, extractErrorMessage } from "@/shared/api/client";
import { toast } from "sonner";
import { BadgeEuro, Building2, Lock, ArrowDownLeft, ArrowUpRight, Loader2, Repeat2, Save, UserRound, X } from "lucide-react";
import { usePlayers } from "@/features/squad/model/usePlayers";
import { getAlternativePositions } from "@/shared/lib/playerPositions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer: ApiTransfer | null;
  currentClub: string;
  currentSeason: string;
  onSave: (data: any, transferId?: string) => Promise<void>;
  saveId: string;
}

type TransferType = "compra" | "venda" | "emprestimo_entrada" | "emprestimo_saida";

const inputClass = "h-10 w-full rounded-md border border-border bg-background/40 px-3 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-primary/60 focus:ring-1 focus:ring-primary/30 disabled:opacity-60";
const lockedClass = "cursor-not-allowed bg-muted/50 pl-9 text-muted-foreground";
const labelClass = "mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground";

const TransferModal = ({ open, onOpenChange, transfer, currentClub, currentSeason, onSave, saveId }: Props) => {
  const { data: activePlayers = [] } = usePlayers(saveId, true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    playerId: "",
    playerName: "",
    type: "compra" as TransferType,
    from: "",
    to: "",
    fee: "",
  });

  const isEntry = form.type === "compra" || form.type === "emprestimo_entrada";
  const isExit  = form.type === "venda"  || form.type === "emprestimo_saida";

  const exitPlayerOptions = useMemo(() => {
    const options = activePlayers.map((player) => ({
      id: player.id,
      label: `${player.name} (${[player.position, ...getAlternativePositions(player)].join("/")})`,
    }));

    if (transfer?.playerId && !options.some((player) => player.id === transfer.playerId)) {
      options.unshift({
        id: transfer.playerId,
        label: `${transfer.playerName} (not in squad)`,
      });
    }

    return options;
  }, [activePlayers, transfer]);

  useEffect(() => {
    if (transfer) {
      setForm({
        playerId: transfer.playerId || "",
        playerName: transfer.playerName,
        type: transfer.type as TransferType,
        from: transfer.from,
        to: transfer.to,
        fee: transfer.fee == null ? "" : String(transfer.fee),
      });
    } else {
      setForm({
        playerId: "",
        playerName: "",
        type: "compra",
        from: "",
        to: currentClub,
        fee: "",
      });
    }
  }, [transfer, open, currentClub]);

  // Auto-fill the locked club field when type changes
  useEffect(() => {
    if (isEntry) {
      setForm((prev) => ({ ...prev, to: currentClub }));
    } else {
      setForm((prev) => ({ ...prev, from: currentClub }));
    }
  }, [form.type, currentClub, isEntry]);

  const handlePlayerSelect = (pId: string) => {
    const player = activePlayers.find(p => p.id === pId);
    if (!player && transfer?.playerId === pId) {
      setForm((prev) => ({
        ...prev,
        playerId: transfer.playerId || "",
        playerName: transfer.playerName,
        from: isExit ? currentClub : prev.from,
        to: isEntry ? currentClub : prev.to,
      }));
      return;
    }

    if (!player) {
      setForm(prev => ({ ...prev, playerId: "", playerName: "" }));
      return;
    }
    setForm(prev => ({
      ...prev,
      playerId: player.id,
      playerName: player.name,
      from: isExit ? currentClub : prev.from,
      to: isEntry ? currentClub : prev.to,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isExit && !form.playerId) {
      toast.error("Select a player from the squad.", { duration: 3000 });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(
        { ...form, season: currentSeason, fee: form.fee ? parseFloat(form.fee) : undefined },
        transfer?.id
      );
      onOpenChange(false);
    } catch (err: any) {
      toast.error(extractErrorMessage(err), { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent data-tour="transfer-modal" className="max-w-3xl border-border bg-card p-0" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="border-b border-border px-6 py-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {transfer ? "Update transfer" : "New transfer"}
          </p>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl leading-none">
            {isEntry ? <ArrowDownLeft size={20} className="text-primary" /> : <ArrowUpRight size={20} className="text-accent" />}
            {transfer ? "Edit movement" : "Register movement"}
          </DialogTitle>
          <DialogDescription>
            Register incoming, outgoing and loan transfers with financial impact and automatic squad update.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-5">
          <fieldset className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.9fr]" disabled={isSubmitting}>
            <FormSection dataTour="transfer-modal-player" icon={UserRound} title="Player" compact>
              <div className="grid grid-cols-1 gap-3">
                <Field label="Transfer type" icon={Repeat2}>
                  <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value as TransferType })}>
                    <SelectTrigger className="h-10 border-border bg-background/40 text-sm text-foreground transition-colors hover:border-primary/40 focus:ring-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card text-foreground shadow-xl shadow-black/30">
                      <SelectItem value="compra" className="focus:bg-primary/10 focus:text-primary">Purchase</SelectItem>
                      <SelectItem value="venda" className="focus:bg-primary/10 focus:text-primary">Sale</SelectItem>
                      <SelectItem value="emprestimo_entrada" className="focus:bg-primary/10 focus:text-primary">Loan in</SelectItem>
                      <SelectItem value="emprestimo_saida" className="focus:bg-primary/10 focus:text-primary">Loan out</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Player">
                  {isExit ? (
                    <Select value={form.playerId || "none"} onValueChange={(value) => handlePlayerSelect(value === "none" ? "" : value)}>
                      <SelectTrigger className="h-10 border-border bg-background/40 text-sm text-foreground transition-colors hover:border-primary/40 focus:ring-primary/30">
                        <SelectValue placeholder="Selecionar jogador do elenco" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72 border-border bg-card text-foreground shadow-xl shadow-black/30">
                        <SelectItem value="none" className="text-muted-foreground focus:bg-muted focus:text-foreground">
                          Select a squad player
                        </SelectItem>
                        {exitPlayerOptions.map((player) => (
                          <SelectItem key={player.id} value={player.id} className="focus:bg-primary/10 focus:text-primary">
                            {player.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <input
                      className={inputClass}
                      value={form.playerName}
                      onChange={(e) => setForm({ ...form, playerName: e.target.value })}
                      placeholder="Player name"
                      required
                    />
                  )}
                </Field>
              </div>
            </FormSection>

            <FormSection dataTour="transfer-modal-market" icon={BadgeEuro} title="Market" compact>
              <div className="grid grid-cols-1 gap-3">
                <Field label="Value">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      className={`${inputClass} pr-11`}
                      value={form.fee}
                      onChange={(e) => setForm({ ...form, fee: e.target.value })}
                      placeholder="45"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">M€</span>
                  </div>
                  {(form.type === "emprestimo_entrada" || form.type === "emprestimo_saida") && (
                    <p className="mt-1.5 text-xs text-muted-foreground">Loans do not affect the team balance.</p>
                  )}
                </Field>

                <Field label="Season">
                  <div className="relative">
                    <input className={`${inputClass} ${lockedClass}`} value={currentSeason} disabled />
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </Field>
              </div>
            </FormSection>

            <FormSection dataTour="transfer-modal-clubs" icon={Building2} title="Clubs">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="From">
                  <div className="relative">
                    <input
                      className={`${inputClass} ${isExit ? lockedClass : ""}`}
                      value={isExit ? currentClub : form.from}
                      onChange={(e) => !isExit && setForm({ ...form, from: e.target.value })}
                      disabled={isExit}
                      placeholder="Origin club"
                      required
                    />
                    {isExit && <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />}
                  </div>
                </Field>
                <Field label="To">
                  <div className="relative">
                    <input
                      className={`${inputClass} ${isEntry ? lockedClass : ""}`}
                      value={isEntry ? currentClub : form.to}
                      onChange={(e) => !isEntry && setForm({ ...form, to: e.target.value })}
                      disabled={isEntry}
                      placeholder="Destination club"
                      required
                    />
                    {isEntry && <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />}
                  </div>
                </Field>
              </div>
            </FormSection>

            <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end lg:col-span-2">
              <button
                data-tour="transfer-modal-cancel"
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 rounded-md bg-muted px-5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                <X size={14} />
                Cancel
              </button>
              <button
                data-tour="transfer-modal-save"
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-[opacity,transform] hover:opacity-90 active:scale-[0.97] disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={15} />}
                {transfer ? "Save changes" : "Register transfer"}
              </button>
            </div>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
};

function FormSection({
  icon: Icon,
  title,
  children,
  compact = false,
  dataTour,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  compact?: boolean;
  dataTour?: string;
}) {
  return (
    <section data-tour={dataTour} className={`rounded-lg border border-border bg-muted/20 p-4 ${compact ? "lg:self-start" : "lg:col-span-2"}`}>
      <div className="mb-4 flex items-center gap-2">
        <Icon size={15} className="text-primary" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
      </div>
      {children}
    </section>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>
        {Icon && <Icon size={12} className="mr-1 inline text-muted-foreground" />}
        {label}
      </label>
      {children}
    </div>
  );
}

export default TransferModal;
