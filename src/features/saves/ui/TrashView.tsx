import { ChevronLeft, Loader2, RotateCcw, Shield, Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { extractErrorMessage, type ApiDeletedSave } from "@/shared/api/client";
import { useDeletedSaves, useRestoreSave, useDeleteSave } from "@/features/saves/model/useSaves";

interface Props {
  onBack: () => void;
}

const formatDeletedAt = (value?: string) => {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const TrashView = ({ onBack }: Props) => {
  const { data: deletedSaves = [], isLoading } = useDeletedSaves();
  const restoreSave = useRestoreSave();
  const deleteSave = useDeleteSave();

  const handleRestore = (save: ApiDeletedSave) => {
    restoreSave.mutate(save.id, {
      onSuccess: () => toast.success(`“${save.name}” restored.`, { duration: 3000 }),
      onError: (error) => toast.error(extractErrorMessage(error), { duration: 5000 }),
    });
  };

  const handlePurge = (save: ApiDeletedSave) => {
    if (!confirm(`Permanently delete “${save.name}”? This cannot be undone.`)) return;
    deleteSave.mutate(
      { saveId: save.id, purge: true },
      {
        onSuccess: () => toast.success(`“${save.name}” deleted permanently.`, { duration: 3000 }),
        onError: (error) => toast.error(extractErrorMessage(error), { duration: 5000 }),
      },
    );
  };

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col py-8">
      <button onClick={onBack} className="mb-5 flex items-center gap-2 self-start text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ChevronLeft size={16} />
        Back to careers
      </button>

      <div className="mb-6">
        <p className="font-display text-xl font-bold leading-none">Trash</p>
        <p className="mt-1 text-sm text-muted-foreground">Archived saves are kept here. Restore them anytime or delete them for good.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-5 py-4 text-muted-foreground">
            <Loader2 size={22} className="animate-spin text-primary" />
            <span className="font-medium">Loading trash...</span>
          </div>
        </div>
      ) : deletedSaves.length === 0 ? (
        <div className="card-gamer flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
            <Trash2 size={24} />
          </div>
          <h3 className="font-display text-2xl font-bold leading-none">The trash is empty</h3>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">Saves you archive will appear here, ready to be restored.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deletedSaves.map((save) => (
            <article key={save.id} className="card-gamer flex flex-col p-5">
              <h3 className="truncate font-display text-xl font-bold leading-none">{save.name}</h3>
              <div className="mt-4 space-y-2">
                <p className="flex items-center gap-2 truncate text-sm text-muted-foreground">
                  <Shield size={15} className="shrink-0 text-primary/80" />
                  <span className="font-medium text-foreground">{save.currentClubStint?.club ?? "Club not set"}</span>
                </p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Trophy size={15} className="shrink-0 text-muted-foreground/80" />
                  <span>Season {save.currentSeason}</span>
                </p>
              </div>
              <p className="mt-4 rounded-md border border-border/80 bg-background/35 px-3 py-2 text-xs text-muted-foreground">
                Archived on {formatDeletedAt(save.deletedAt)}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRestore(save)}
                  disabled={restoreSave.isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 font-display text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {restoreSave.isPending && restoreSave.variables === save.id
                    ? <Loader2 size={15} className="animate-spin" />
                    : <RotateCcw size={15} />}
                  Restore
                </button>
                <button
                  type="button"
                  onClick={() => handlePurge(save)}
                  disabled={deleteSave.isPending}
                  title="Delete permanently"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive-text disabled:opacity-50"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default TrashView;
