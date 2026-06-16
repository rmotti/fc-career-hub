import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Activity,
  ArrowLeftRight,
  CalendarPlus,
  CircleDollarSign,
  Clock3,
  History,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Shield,
  Trash2,
  TriangleAlert,
  UserMinus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  extractErrorMessage,
  type ApiAuditEntry,
  type ApiSnapshot,
  type SnapshotReason,
} from "@/shared/api/client";
import {
  useSnapshots,
  useCreateSnapshot,
  useRestoreSnapshot,
  useAudit,
} from "@/features/saves/model/useSaves";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";

interface Props {
  saveId: string;
}

type Tab = "snapshots" | "audit";

const SNAPSHOT_REASON_KEY: Record<SnapshotReason, string> = {
  "pre-season-advance": "activity.reasons.preSeasonAdvance",
  "pre-delete": "activity.reasons.preDelete",
  "pre-transfer-reverse": "activity.reasons.preTransferReverse",
  "pre-player-release": "activity.reasons.prePlayerRelease",
  "pre-club-change": "activity.reasons.preClubChange",
  "pre-fc26-import": "activity.reasons.preFc26Import",
  manual: "activity.reasons.manual",
};

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const ActivityScreen = ({ saveId }: Props) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("snapshots");
  const [snapshotToRestore, setSnapshotToRestore] = useState<ApiSnapshot | null>(null);

  const { data: snapshots = [], isLoading: snapshotsLoading } = useSnapshots(saveId);
  const { data: audit = [], isLoading: auditLoading } = useAudit(saveId);
  const createSnapshot = useCreateSnapshot();
  const restoreSnapshot = useRestoreSnapshot();

  const reasonLabel = (reason: SnapshotReason) =>
    t(SNAPSHOT_REASON_KEY[reason] ?? "activity.reasons.manual");

  const handleCreateSnapshot = () => {
    createSnapshot.mutate(saveId, {
      onSuccess: () => toast.success(t("activity.snapshots.created"), { duration: 3000 }),
      onError: (err) => toast.error(extractErrorMessage(err), { duration: 5000 }),
    });
  };

  const handleRestoreSnapshot = (snapshot: ApiSnapshot) => {
    restoreSnapshot.mutate(
      { saveId, snapshotId: snapshot.id },
      {
        onSuccess: () => {
          toast.success(t("activity.snapshots.restored"), { duration: 4000 });
          setSnapshotToRestore(null);
        },
        onError: (err) => toast.error(extractErrorMessage(err), { duration: 5000 }),
      },
    );
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-5">
      <div className="flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            <Activity size={13} /> {t("activity.kicker")}
          </p>
          <h2 className="font-display text-3xl font-bold leading-none tracking-tight text-foreground">{t("activity.title")}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["snapshots", "audit"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors ${
                tab === item
                  ? "border-primary/25 bg-primary/10 text-primary"
                  : "border-border bg-muted/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              {item === "snapshots" ? <Save size={15} /> : <History size={15} />}
              {item === "snapshots" ? t("activity.tabs.snapshots") : t("activity.tabs.audit")}
            </button>
          ))}
        </div>
      </div>

      {tab === "snapshots" ? (
        <section className="space-y-4">
          <div className="card-gamer flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Save size={19} />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold">{t("activity.snapshots.title")}</h3>
                <p className="text-sm text-muted-foreground">{t("activity.snapshots.subtitle")}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCreateSnapshot}
              disabled={createSnapshot.isPending}
              className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 font-display text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {createSnapshot.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {t("activity.snapshots.create")}
            </button>
          </div>

          {snapshotsLoading ? (
            <LoadingRow label={t("activity.loading")} />
          ) : snapshots.length === 0 ? (
            <EmptyPanel icon={Save} text={t("activity.snapshots.empty")} />
          ) : (
            <div className="card-gamer divide-y divide-border overflow-hidden">
              {snapshots.map((snapshot) => (
                <div key={snapshot.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/30 text-muted-foreground">
                      <Clock3 size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-semibold text-foreground">{reasonLabel(snapshot.reason)}</p>
                      <p className="truncate text-xs text-muted-foreground">{formatDateTime(snapshot.createdAt)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSnapshotToRestore(snapshot)}
                    className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-accent/40 hover:bg-accent/10 hover:text-accent"
                  >
                    <RotateCcw size={13} /> {t("activity.snapshots.restore")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-4">
          {auditLoading ? (
            <LoadingRow label={t("activity.loading")} />
          ) : audit.length === 0 ? (
            <EmptyPanel icon={History} text={t("activity.audit.empty")} />
          ) : (
            <div className="card-gamer divide-y divide-border overflow-hidden">
              {audit.map((entry) => (
                <AuditRow key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </section>
      )}

      <AlertDialog
        open={snapshotToRestore !== null}
        onOpenChange={(open) => { if (!open && !restoreSnapshot.isPending) setSnapshotToRestore(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw size={18} className="text-accent" />
              {t("activity.snapshots.restoreDialogTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  {snapshotToRestore
                    ? t("activity.snapshots.restoreDialogBody", {
                        reason: reasonLabel(snapshotToRestore.reason),
                        date: formatDateTime(snapshotToRestore.createdAt),
                      })
                    : null}
                </p>
                <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-foreground">
                  <TriangleAlert size={16} className="mt-0.5 shrink-0 text-warning" />
                  <span>{t("activity.snapshots.restoreDialogWarning")}</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={restoreSnapshot.isPending}
              onClick={() => setSnapshotToRestore(null)}
              className="rounded-lg border border-border bg-background/50 px-4 py-2.5 font-display text-sm font-bold text-foreground transition-colors hover:border-primary/40 disabled:opacity-50"
            >
              {t("activity.snapshots.cancel")}
            </button>
            <button
              type="button"
              disabled={restoreSnapshot.isPending || !snapshotToRestore}
              onClick={() => snapshotToRestore && handleRestoreSnapshot(snapshotToRestore)}
              className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 font-display text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {restoreSnapshot.isPending ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
              {t("activity.snapshots.restoreConfirm")}
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const AUDIT_ICON: Record<string, React.ElementType> = {
  "save.season_advance": CalendarPlus,
  "save.soft_delete": Trash2,
  "save.purge": Trash2,
  "save.restore": RotateCcw,
  "save.snapshot_create": Save,
  "save.snapshot_restore": RotateCcw,
  "save.finance_edit": CircleDollarSign,
  "transfer.reverse": ArrowLeftRight,
  "player.release": UserMinus,
  "clubstint.change": Shield,
  "squad.import": Users,
};

const AuditRow = ({ entry }: { entry: ApiAuditEntry }) => {
  const { t } = useTranslation();
  const Icon = AUDIT_ICON[entry.action] ?? Activity;
  const description = useMemo(() => describeAudit(entry, t), [entry, t]);

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/30 text-muted-foreground">
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">{description}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
      </div>
    </div>
  );
};

function describeAudit(entry: ApiAuditEntry, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const meta = entry.meta ?? {};
  switch (entry.action) {
    case "save.season_advance":
      return t("activity.audit.actions.seasonAdvance", { from: meta.from, to: meta.to });
    case "save.soft_delete":
      return t("activity.audit.actions.softDelete", { name: meta.name });
    case "save.purge":
      return t("activity.audit.actions.purge", { name: meta.name });
    case "save.restore":
      return t("activity.audit.actions.restore");
    case "save.snapshot_create":
      return t("activity.audit.actions.snapshotCreate");
    case "save.snapshot_restore":
      return t("activity.audit.actions.snapshotRestore");
    case "save.finance_edit": {
      const parts: string[] = [];
      if (meta.budget) parts.push(t("activity.audit.actions.financeBudget", { from: meta.budget.from, to: meta.budget.to }));
      if (meta.balance) parts.push(t("activity.audit.actions.financeBalance", { from: meta.balance.from, to: meta.balance.to }));
      return parts.length ? parts.join(" · ") : t("activity.audit.actions.financeEdit");
    }
    case "transfer.reverse":
      return t("activity.audit.actions.transferReverse", { name: meta.playerName });
    case "player.release":
      return t("activity.audit.actions.playerRelease", { name: meta.playerName });
    case "clubstint.change":
      return t("activity.audit.actions.clubChange", { from: meta.from, to: meta.to, season: meta.season });
    case "squad.import":
      return t("activity.audit.actions.squadImport", { club: meta.club, importing: meta.importing, skipped: meta.skipped });
    default:
      return entry.action;
  }
}

const LoadingRow = ({ label }: { label: string }) => (
  <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
    <Loader2 size={20} className="animate-spin" /> {label}
  </div>
);

const EmptyPanel = ({ icon: Icon, text }: { icon: React.ElementType; text: string }) => (
  <div className="card-gamer flex flex-col items-center justify-center p-10 text-center">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
      <Icon size={24} />
    </div>
    <p className="max-w-md text-sm text-muted-foreground">{text}</p>
  </div>
);

export default ActivityScreen;
