import { useEffect, useMemo, useState } from "react";
import { Globe, Loader2, Plus, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { extractErrorMessage, type ApiCompetition, type CompetitionType } from "@/shared/api/client";
import { useCompetitions } from "@/features/change-club/model/useCompetitions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  season?: string;
  saveCountry: string | null;
  registeredCompetitionIds: string[];
  onAdd: (competitionId: string) => Promise<void>;
}

const TYPE_ORDER: CompetitionType[] = ["League", "EuropeanCup", "NationalCup", "SuperCup"];

const TYPE_LABELS: Record<CompetitionType, string> = {
  League: "Leagues",
  EuropeanCup: "European cups",
  NationalCup: "National cups",
  SuperCup: "Super cups",
};

const groupByType = (competitions: ApiCompetition[]) =>
  TYPE_ORDER.map((type) => ({
    type,
    label: TYPE_LABELS[type],
    competitions: competitions
      .filter((competition) => competition.type === type)
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((group) => group.competitions.length > 0);

const AddCompetitionModal = ({ open, onOpenChange, season, saveCountry, registeredCompetitionIds, onAdd }: Props) => {
  const { data: competitions = [], isLoading } = useCompetitions();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedId(null);
      setIsSubmitting(false);
    }
  }, [open]);

  const registered = useMemo(() => new Set(registeredCompetitionIds), [registeredCompetitionIds]);
  const available = useMemo(
    () =>
      competitions.filter((competition) => {
        if (registered.has(competition.id)) return false;
        // Only the save's own country competitions plus the European cups.
        // When the country can't be determined, fall back to showing everything
        // so the user is never left with an empty list.
        if (competition.type === "EuropeanCup") return true;
        return saveCountry ? competition.country === saveCountry : true;
      }),
    [competitions, registered, saveCountry],
  );
  const groups = useMemo(() => groupByType(available), [available]);

  const handleSubmit = async () => {
    if (!selectedId) return;
    setIsSubmitting(true);
    try {
      await onAdd(selectedId);
      onOpenChange(false);
    } catch (err: any) {
      if (err?.status === 409) {
        toast.error("This competition is already registered for this season.", { duration: 5000 });
      } else {
        toast.error(extractErrorMessage(err), { duration: 5000 });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] max-w-2xl flex-col overflow-hidden border-border bg-card p-0">
        <div className="shrink-0 border-b border-border bg-background/35 px-5 py-4">
          <DialogHeader>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Trophy size={15} />
              </div>
              <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Add competition
              </span>
            </div>
            <DialogTitle className="font-display text-2xl leading-none">
              Register a competition
            </DialogTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              Pick a competition to add to your club{season ? ` for ${season}` : ""}. It starts with no results — edit it afterwards to fill in the numbers.
            </p>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 size={18} className="animate-spin" /> Loading competitions...
            </div>
          ) : groups.length === 0 ? (
            <div className="rounded-md border border-border bg-background/25 p-6 text-center">
              <p className="font-display text-lg font-bold text-foreground">Nothing left to add</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Every available competition is already registered for this season.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {groups.map((group) => (
                <section key={group.type}>
                  <div className="mb-2 flex items-center gap-2">
                    {group.type === "EuropeanCup" ? (
                      <Globe size={13} className="text-primary" />
                    ) : (
                      <Trophy size={13} className="text-muted-foreground" />
                    )}
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{group.label}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {group.competitions.map((competition) => {
                      const isSelected = selectedId === competition.id;
                      return (
                        <button
                          key={competition.id}
                          type="button"
                          onClick={() => setSelectedId(competition.id)}
                          className={`flex items-center justify-between gap-3 rounded-md border px-3 py-3 text-left transition-colors ${
                            isSelected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-background/30 text-foreground hover:border-primary/40"
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-display text-sm font-bold">{competition.name}</span>
                            {competition.country && (
                              <span className="mt-0.5 block truncate text-xs text-muted-foreground">{competition.country}</span>
                            )}
                          </span>
                          {isSelected && <Plus size={15} className="shrink-0 rotate-45 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-background/35 p-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <X size={14} />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedId}
            className="flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 font-display text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add competition
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddCompetitionModal;
