import { Archive, Loader2, Trash2, TriangleAlert } from "lucide-react";
import { type ApiSave } from "@/shared/api/client";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";

interface Props {
  save: ApiSave | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onArchive: (save: ApiSave) => void;
  onPurge: (save: ApiSave) => void;
  pending: boolean;
}

const DeleteSaveDialog = ({ save, open, onOpenChange, onArchive, onPurge, pending }: Props) => (
  <AlertDialog open={open} onOpenChange={(next) => { if (!pending) onOpenChange(next); }}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle className="flex items-center gap-2">
          <Trash2 size={18} className="text-destructive-text" />
          Delete “{save?.name}”?
        </AlertDialogTitle>
        <AlertDialogDescription asChild>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Choose how you want to remove this save.</p>
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-foreground">
              <TriangleAlert size={16} className="mt-0.5 shrink-0 text-destructive-text" />
              <span>Deleting permanently cannot be undone. Archiving moves the save to the trash, where you can restore it later.</span>
            </div>
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={pending}
          onClick={() => onOpenChange(false)}
          className="rounded-lg border border-border bg-background/50 px-4 py-2.5 font-display text-sm font-bold text-foreground transition-colors hover:border-primary/40 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={pending || !save}
          onClick={() => save && onArchive(save)}
          className="flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2.5 font-display text-sm font-bold text-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
        >
          <Archive size={16} /> Archive
        </button>
        <button
          type="button"
          disabled={pending || !save}
          onClick={() => save && onPurge(save)}
          className="flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2.5 font-display text-sm font-bold text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          Delete permanently
        </button>
      </div>
    </AlertDialogContent>
  </AlertDialog>
);

export default DeleteSaveDialog;
