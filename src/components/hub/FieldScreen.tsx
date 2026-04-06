import { useState, useMemo, useCallback, useEffect } from "react";
import { Plus, X } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { usePlayers } from "@/hooks/usePlayers";
import { type ApiPlayer } from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// ── Formation definitions ──────────────────────────────────────────────────

type FormationDef = { name: string; rows: string[][] };

const FORMATIONS: FormationDef[] = [
  { name: "4-4-2",          rows: [["GOL"], ["LD","ZAG","ZAG","LE"], ["MD","MC","MC","ME"], ["ATA","ATA"]] },
  { name: "4-4-2 Diamante", rows: [["GOL"], ["LD","ZAG","ZAG","LE"], ["VOL"], ["MC","MC"], ["MEI"], ["ATA","ATA"]] },
  { name: "4-3-3",          rows: [["GOL"], ["LD","ZAG","ZAG","LE"], ["VOL","MC","MC"], ["PE","ATA","PD"]] },
  { name: "4-3-3 Falso 9",  rows: [["GOL"], ["LD","ZAG","ZAG","LE"], ["VOL","MC","MC"], ["PE","SA","PD"]] },
  { name: "4-2-3-1",        rows: [["GOL"], ["LD","ZAG","ZAG","LE"], ["VOL","VOL"], ["ME","MEI","MD"], ["ATA"]] },
  { name: "4-1-4-1",        rows: [["GOL"], ["LD","ZAG","ZAG","LE"], ["VOL"], ["ME","MC","MC","MD"], ["ATA"]] },
  { name: "4-1-2-1-2",      rows: [["GOL"], ["LD","ZAG","ZAG","LE"], ["VOL"], ["MC","MC"], ["MEI"], ["ATA","ATA"]] },
  { name: "4-3-2-1",        rows: [["GOL"], ["LD","ZAG","ZAG","LE"], ["VOL","MC","MC"], ["MEI","MEI"], ["ATA"]] },
  { name: "4-4-1-1",        rows: [["GOL"], ["LD","ZAG","ZAG","LE"], ["MD","MC","MC","ME"], ["SA"], ["ATA"]] },
  { name: "4-5-1",          rows: [["GOL"], ["LD","ZAG","ZAG","LE"], ["MD","VOL","MC","VOL","ME"], ["ATA"]] },
  { name: "3-5-2",          rows: [["GOL"], ["ZAG","ZAG","ZAG"], ["LD","VOL","MC","VOL","LE"], ["ATA","ATA"]] },
  { name: "3-4-3",          rows: [["GOL"], ["ZAG","ZAG","ZAG"], ["LD","MC","MC","LE"], ["PE","ATA","PD"]] },
  { name: "3-4-2-1",        rows: [["GOL"], ["ZAG","ZAG","ZAG"], ["LD","MC","MC","LE"], ["MEI","MEI"], ["ATA"]] },
  { name: "3-3-3-1",        rows: [["GOL"], ["ZAG","ZAG","ZAG"], ["VOL","MC","VOL"], ["PE","MEI","PD"], ["ATA"]] },
  { name: "5-3-2",          rows: [["GOL"], ["LE","ZAG","ZAG","ZAG","LD"], ["MC","VOL","MC"], ["ATA","ATA"]] },
  { name: "5-4-1",          rows: [["GOL"], ["LE","ZAG","ZAG","ZAG","LD"], ["MD","MC","MC","ME"], ["ATA"]] },
  { name: "5-2-3",          rows: [["GOL"], ["LE","ZAG","ZAG","ZAG","LD"], ["VOL","MC"], ["PE","ATA","PD"]] },
];

// ── Design tokens ──────────────────────────────────────────────────────────

type SlotColors = { border: string; bg: string; text: string; glow: string; badge: string };

const SLOT_COLORS: Record<string, SlotColors> = {
  GOL: { border: "border-yellow-400/60", bg: "bg-yellow-950/60",  text: "text-yellow-300", glow: "shadow-[0_0_18px_rgba(234,179,8,0.30)]",    badge: "bg-yellow-400/20 text-yellow-300" },
  LD:  { border: "border-cyan-400/60",   bg: "bg-cyan-950/60",    text: "text-cyan-300",   glow: "shadow-[0_0_18px_rgba(34,211,238,0.25)]",   badge: "bg-cyan-400/20 text-cyan-300" },
  LE:  { border: "border-cyan-400/60",   bg: "bg-cyan-950/60",    text: "text-cyan-300",   glow: "shadow-[0_0_18px_rgba(34,211,238,0.25)]",   badge: "bg-cyan-400/20 text-cyan-300" },
  ZAG: { border: "border-cyan-400/60",   bg: "bg-cyan-950/60",    text: "text-cyan-300",   glow: "shadow-[0_0_18px_rgba(34,211,238,0.25)]",   badge: "bg-cyan-400/20 text-cyan-300" },
  VOL: { border: "border-green-400/60",  bg: "bg-green-950/60",   text: "text-green-300",  glow: "shadow-[0_0_18px_rgba(74,222,128,0.25)]",   badge: "bg-green-400/20 text-green-300" },
  MC:  { border: "border-green-400/60",  bg: "bg-green-950/60",   text: "text-green-300",  glow: "shadow-[0_0_18px_rgba(74,222,128,0.25)]",   badge: "bg-green-400/20 text-green-300" },
  ME:  { border: "border-green-400/60",  bg: "bg-green-950/60",   text: "text-green-300",  glow: "shadow-[0_0_18px_rgba(74,222,128,0.25)]",   badge: "bg-green-400/20 text-green-300" },
  MD:  { border: "border-green-400/60",  bg: "bg-green-950/60",   text: "text-green-300",  glow: "shadow-[0_0_18px_rgba(74,222,128,0.25)]",   badge: "bg-green-400/20 text-green-300" },
  MEI: { border: "border-green-400/60",  bg: "bg-green-950/60",   text: "text-green-300",  glow: "shadow-[0_0_18px_rgba(74,222,128,0.25)]",   badge: "bg-green-400/20 text-green-300" },
  ATA: { border: "border-red-400/60",    bg: "bg-red-950/60",     text: "text-red-300",    glow: "shadow-[0_0_18px_rgba(248,113,113,0.25)]",  badge: "bg-red-400/20 text-red-300" },
  PE:  { border: "border-red-400/60",    bg: "bg-red-950/60",     text: "text-red-300",    glow: "shadow-[0_0_18px_rgba(248,113,113,0.25)]",  badge: "bg-red-400/20 text-red-300" },
  PD:  { border: "border-red-400/60",    bg: "bg-red-950/60",     text: "text-red-300",    glow: "shadow-[0_0_18px_rgba(248,113,113,0.25)]",  badge: "bg-red-400/20 text-red-300" },
  SA:  { border: "border-red-400/60",    bg: "bg-red-950/60",     text: "text-red-300",    glow: "shadow-[0_0_18px_rgba(248,113,113,0.25)]",  badge: "bg-red-400/20 text-red-300" },
};

const POSITION_ORDER: Record<string, number> = {
  GOL: 0,
  LD: 1, ZAG: 2, LE: 3,
  VOL: 4, MC: 5, MD: 6, ME: 7, MEI: 8,
  PE: 9, PD: 10, SA: 11, ATA: 12,
};

const FALLBACK_COLORS: SlotColors = {
  border: "border-white/20", bg: "bg-white/5", text: "text-white/60",
  glow: "", badge: "bg-white/10 text-white/50",
};

// ── Position restrictions ──────────────────────────────────────────────────

const ALLOWED_PLAYER_POSITIONS: Record<string, string[]> = {
  GOL: ["GOL"],
  LD:  ["LD", "LE", "ZAG"],
  LE:  ["LD", "LE", "ZAG"],
  ZAG: ["LD", "LE", "ZAG"],
  VOL: ["VOL", "MC", "ME", "MD", "MEI"],
  MC:  ["VOL", "MC", "ME", "MD", "MEI"],
  ME:  ["VOL", "MC", "ME", "MD", "MEI"],
  MD:  ["VOL", "MC", "ME", "MD", "MEI"],
  MEI: ["VOL", "MC", "ME", "MD", "MEI"],
  ATA: ["ATA", "PE", "PD", "SA"],
  PE:  ["ATA", "PE", "PD", "SA"],
  PD:  ["ATA", "PE", "PD", "SA"],
  SA:  ["ATA", "PE", "PD", "SA"],
};

// ── Persistence ────────────────────────────────────────────────────────────

const BENCH_SIZE = 11;

interface FieldState {
  formation: string;
  starters: (string | null)[];
  bench: (string | null)[];
}

function loadState(saveId: string): FieldState {
  try {
    const raw = localStorage.getItem(`field-${saveId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { formation: FORMATIONS[0].name, starters: Array(11).fill(null), bench: Array(BENCH_SIZE).fill(null) };
}

function persistState(saveId: string, state: FieldState) {
  localStorage.setItem(`field-${saveId}`, JSON.stringify(state));
}

// ── Pure player card (display only) ───────────────────────────────────────

const PlayerCard = ({ player, compact = false, overlay = false, isSelected = false }: { player: ApiPlayer; compact?: boolean; overlay?: boolean; isSelected?: boolean }) => {
  const c = SLOT_COLORS[player.position] ?? FALLBACK_COLORS;
  const w = compact ? "w-12" : "w-[60px]";
  const h = compact ? 60 : 72;
  return (
    <div
      className={`${w} border ${c.border} ${c.bg} ${c.glow} rounded-lg flex flex-col items-center justify-center gap-0.5 backdrop-blur-sm select-none transition-all ${overlay ? "rotate-2 scale-105 opacity-95" : ""} ${isSelected ? "brightness-125 scale-105" : ""}`}
      style={{ height: h }}
    >
      <span className={`text-[8px] font-display font-bold tracking-widest leading-none px-1.5 py-0.5 rounded ${c.badge}`}>
        {player.position}
      </span>
      <span className={`font-display font-bold leading-none ${c.text} ${compact ? "text-base" : "text-xl"}`}>
        {player.ovr}
      </span>
      <span className="text-[9px] text-white/65 font-medium leading-none max-w-[52px] text-center truncate px-0.5">
        {player.name.split(" ").slice(-1)[0]}
      </span>
    </div>
  );
};

// ── Draggable wrapper ──────────────────────────────────────────────────────

const Draggable = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ opacity: isDragging ? 0 : 1, touchAction: "none", cursor: "grab" }}
    >
      {children}
    </div>
  );
};

// ── Droppable slot ─────────────────────────────────────────────────────────

interface SlotProps {
  slotId: string;
  position: string;
  player?: ApiPlayer;
  // drag
  isValid: boolean;
  isDraggingAny: boolean;
  // selection
  isSelected: boolean;
  isSelectionActive: boolean;
  isValidForSelection: boolean;
  compact?: boolean;
  showPosition?: boolean;
  onRemove: () => void;
  onSlotClick: () => void;
}

const Slot = ({ slotId, position, player, isValid, isDraggingAny, isSelected, isSelectionActive, isValidForSelection, compact, showPosition = true, onRemove, onSlotClick }: SlotProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: slotId });
  const w = compact ? "w-12" : "w-[60px]";
  const h = compact ? 60 : 72;

  // Ring from drag-over
  const dragRing = isDraggingAny && isOver
    ? isValid
      ? "ring-2 ring-primary/80 ring-offset-1 ring-offset-black/50"
      : "ring-2 ring-destructive/60 ring-offset-1 ring-offset-black/50"
    : "";

  // Ring from click-selection
  const selectionRing = !isDraggingAny && isSelectionActive && isOver
    ? isValidForSelection
      ? "ring-2 ring-primary/80 ring-offset-1 ring-offset-black/50"
      : ""
    : isSelected
    ? "ring-2 ring-primary ring-offset-1 ring-offset-black/50"
    : "";

  const ringClass = dragRing || selectionRing;

  if (player) {
    return (
      <div className="flex flex-col items-center">
        <div
          ref={setNodeRef}
          className={`relative rounded-lg ${ringClass} transition-all cursor-pointer`}
          onClick={onSlotClick}
        >
          <div className={`group transition-opacity ${isSelectionActive && !isSelected && !isValidForSelection ? "opacity-40" : ""}`}>
            <Draggable id={player.id}>
              <PlayerCard player={player} compact={compact} isSelected={isSelected} />
            </Draggable>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive border-2 border-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-400 z-20"
            >
              <X size={7} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty slot — visual varies by mode
  const isActiveMode = isDraggingAny || isSelectionActive;
  const isThisValid = isDraggingAny ? isValid : isValidForSelection;

  const emptyBorder = isActiveMode && isThisValid
    ? isOver ? "border-primary/60 bg-primary/10" : "border-primary/30"
    : isActiveMode && !isThisValid
    ? "border-white/6 opacity-30"
    : "border-white/15 hover:border-white/30 hover:bg-white/[0.04]";

  return (
    <div className="flex flex-col items-center">
      <div
        ref={setNodeRef}
        className={`${w} border border-dashed ${emptyBorder} ${ringClass} rounded-lg flex flex-col items-center justify-center gap-1 transition-all`}
        style={{ height: h }}
      >
        {!isActiveMode ? (
          <button
            onClick={onSlotClick}
            className="flex flex-col items-center gap-1 w-full h-full justify-center"
          >
            <Plus size={compact ? 12 : 14} className="text-white/25" />
            {showPosition && (
              <span className="text-[8px] font-display tracking-widest text-white/25 leading-none">
                {position}
              </span>
            )}
          </button>
        ) : (
          <div
            className="flex flex-col items-center gap-1 w-full h-full justify-center cursor-pointer"
            onClick={isThisValid ? onSlotClick : undefined}
          >
            {isThisValid
              ? <Plus size={compact ? 12 : 14} className={isOver ? "text-primary/80" : "text-primary/50"} />
              : <X size={compact ? 10 : 12} className="text-white/10" />
            }
            {showPosition && isThisValid && (
              <span className={`text-[8px] font-display tracking-widest leading-none ${isOver ? "text-primary/80" : "text-primary/40"}`}>
                {position}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main screen ────────────────────────────────────────────────────────────

interface Props { saveId: string }

type SelectingSlot = { type: "starter"; index: number } | { type: "bench"; index: number };

const FieldScreen = ({ saveId }: Props) => {
  const { data: players = [], isLoading } = usePlayers(saveId, true);
  const [state, setState] = useState<FieldState>(() => loadState(saveId));
  const [selectingSlot, setSelectingSlot] = useState<SelectingSlot | null>(null);
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const formation = FORMATIONS.find((f) => f.name === state.formation) ?? FORMATIONS[0];
  const starterPositions = useMemo(() => formation.rows.flatMap((r) => r), [formation]);

  const rowSlots = useMemo(() => {
    let idx = 0;
    const byRow = formation.rows.map((row) => row.map(() => idx++));
    return byRow.slice().reverse();
  }, [formation]);

  const assignedIds = useMemo(
    () => new Set([...state.starters, ...state.bench].filter(Boolean) as string[]),
    [state.starters, state.bench]
  );

  const playerById = useMemo(() => {
    const m = new Map<string, ApiPlayer>();
    players.forEach((p) => m.set(p.id, p));
    return m;
  }, [players]);

  const reservePlayers = useMemo(
    () => players.filter((p) => !assignedIds.has(p.id)),
    [players, assignedIds]
  );

  // Is the currently-dragged player valid for a given slot id?
  const isValidForSlot = useCallback((slotId: string): boolean => {
    if (!activePlayerId) return false;
    const [type, idxStr] = slotId.split(":");
    if (type === "bench") return true;
    const idx = parseInt(idxStr);
    const slotPos = starterPositions[idx];
    const allowed = ALLOWED_PLAYER_POSITIONS[slotPos] ?? [];
    const p = playerById.get(activePlayerId);
    return p ? allowed.includes(p.position) : false;
  }, [activePlayerId, starterPositions, playerById]);

  const availableForSelection = useMemo(() => {
    if (!selectingSlot) return [];
    const currentId =
      selectingSlot.type === "starter"
        ? state.starters[selectingSlot.index]
        : state.bench[selectingSlot.index];
    const allowed =
      selectingSlot.type === "starter"
        ? (ALLOWED_PLAYER_POSITIONS[starterPositions[selectingSlot.index]] ?? [])
        : null;
    return players.filter((p) => {
      const free = !assignedIds.has(p.id) || p.id === currentId;
      const ok = allowed === null || allowed.includes(p.position);
      return free && ok;
    });
  }, [selectingSlot, players, assignedIds, state, starterPositions]);

  const update = useCallback((patch: Partial<FieldState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      persistState(saveId, next);
      return next;
    });
  }, [saveId]);

  // ── Escape to deselect ────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedPlayerId(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Click-to-place ────────────────────────────────────────────────────

  const isValidForSelection = useCallback((slotId: string): boolean => {
    if (!selectedPlayerId) return false;
    const [type, idxStr] = slotId.split(":");
    if (type === "bench") return true;
    const idx = parseInt(idxStr);
    const slotPos = starterPositions[idx];
    const allowed = ALLOWED_PLAYER_POSITIONS[slotPos] ?? [];
    const p = playerById.get(selectedPlayerId);
    return p ? allowed.includes(p.position) : false;
  }, [selectedPlayerId, starterPositions, playerById]);

  const placeSelectedPlayer = useCallback((target: { type: "starter" | "bench"; index: number }) => {
    const playerId = selectedPlayerId!;
    const player = playerById.get(playerId);
    if (!player) { setSelectedPlayerId(null); return; }

    if (target.type === "starter") {
      const slotPos = starterPositions[target.index];
      const allowed = ALLOWED_PLAYER_POSITIONS[slotPos] ?? [];
      if (!allowed.includes(player.position)) return; // keep selection, let user pick another slot
    }

    const newStarters = [...state.starters];
    const newBench = [...state.bench];
    const fromStarterIdx = newStarters.indexOf(playerId);
    const fromBenchIdx = newBench.indexOf(playerId);

    if (fromStarterIdx !== -1) newStarters[fromStarterIdx] = null;
    if (fromBenchIdx !== -1) newBench[fromBenchIdx] = null;

    let displaced: string | null = null;
    if (target.type === "starter") {
      displaced = newStarters[target.index];
      newStarters[target.index] = playerId;
    } else {
      displaced = newBench[target.index];
      newBench[target.index] = playerId;
    }

    if (displaced) {
      const displacedPlayer = playerById.get(displaced);
      if (fromStarterIdx !== -1 && displacedPlayer) {
        const slotPos = starterPositions[fromStarterIdx];
        const allowed = ALLOWED_PLAYER_POSITIONS[slotPos] ?? [];
        if (allowed.includes(displacedPlayer.position)) newStarters[fromStarterIdx] = displaced;
      } else if (fromBenchIdx !== -1) {
        newBench[fromBenchIdx] = displaced;
      }
    }

    update({ starters: newStarters, bench: newBench });
    setSelectedPlayerId(null);
  }, [selectedPlayerId, playerById, starterPositions, state, update]);

  const handleSlotClick = useCallback((slotType: "starter" | "bench", index: number, currentPlayerId: string | null) => {
    if (selectedPlayerId) {
      placeSelectedPlayer({ type: slotType, index });
    } else if (currentPlayerId) {
      setSelectedPlayerId(currentPlayerId);
      setSelectingSlot(null);
    } else {
      setSelectingSlot({ type: slotType, index });
    }
  }, [selectedPlayerId, placeSelectedPlayer]);

  // ── Drag handlers ──────────────────────────────────────────────────────

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActivePlayerId(String(active.id));
    setSelectedPlayerId(null); // clear selection when drag starts
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActivePlayerId(null);
    if (!over) return;

    const playerId = String(active.id);
    const [targetType, targetIdxStr] = String(over.id).split(":");
    const targetIdx = parseInt(targetIdxStr);

    const player = playerById.get(playerId);
    if (!player) return;

    // Position restriction for starter slots
    if (targetType === "starter") {
      const slotPos = starterPositions[targetIdx];
      const allowed = ALLOWED_PLAYER_POSITIONS[slotPos] ?? [];
      if (!allowed.includes(player.position)) return;
    }

    const newStarters = [...state.starters];
    const newBench = [...state.bench];

    // Find where the player currently is
    const fromStarterIdx = newStarters.indexOf(playerId);
    const fromBenchIdx = newBench.indexOf(playerId);

    // Remove from source
    if (fromStarterIdx !== -1) newStarters[fromStarterIdx] = null;
    if (fromBenchIdx !== -1) newBench[fromBenchIdx] = null;

    // Take what's in the target, place dragged player there
    let displaced: string | null = null;
    if (targetType === "starter") {
      displaced = newStarters[targetIdx];
      newStarters[targetIdx] = playerId;
    } else {
      displaced = newBench[targetIdx];
      newBench[targetIdx] = playerId;
    }

    // Try to send displaced back to the source slot
    if (displaced) {
      const displacedPlayer = playerById.get(displaced);
      if (fromStarterIdx !== -1 && displacedPlayer) {
        const slotPos = starterPositions[fromStarterIdx];
        const allowed = ALLOWED_PLAYER_POSITIONS[slotPos] ?? [];
        if (allowed.includes(displacedPlayer.position)) {
          newStarters[fromStarterIdx] = displaced;
        }
        // else displaced becomes a free reserve
      } else if (fromBenchIdx !== -1) {
        newBench[fromBenchIdx] = displaced;
      }
      // else from reserve → displaced becomes free reserve
    }

    update({ starters: newStarters, bench: newBench });
  };

  // ── Other handlers ─────────────────────────────────────────────────────

  const handleFormationChange = (name: string) => update({ formation: name, starters: Array(11).fill(null) });

  const handleSelectPlayer = (player: ApiPlayer) => {
    if (!selectingSlot) return;
    if (selectingSlot.type === "starter") {
      const next = [...state.starters];
      const prev = next.indexOf(player.id);
      if (prev !== -1) next[prev] = null;
      next[selectingSlot.index] = player.id;
      update({ starters: next });
    } else {
      const next = [...state.bench];
      const prev = next.indexOf(player.id);
      if (prev !== -1) next[prev] = null;
      next[selectingSlot.index] = player.id;
      update({ bench: next });
    }
    setSelectingSlot(null);
  };

  const removeStarter = (i: number) => {
    const next = [...state.starters]; next[i] = null; update({ starters: next });
  };
  const removeBench = (i: number) => {
    const next = [...state.bench]; next[i] = null; update({ bench: next });
  };

  const filledStarters = state.starters.filter(Boolean).length;
  const filledBench = state.bench.filter(Boolean).length;
  const isDraggingAny = activePlayerId !== null;
  const isSelectionActive = selectedPlayerId !== null;

  const activePlayer = activePlayerId ? playerById.get(activePlayerId) : null;

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">Field</h1>
            <p className="text-sm text-muted-foreground">
              {filledStarters}/11 titulares · {filledBench}/11 banco
            </p>
          </div>
          <Select value={state.formation} onValueChange={handleFormationChange}>
            <SelectTrigger className="w-48 bg-card border-border font-display font-bold text-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="font-display max-h-72">
              {FORMATIONS.map((f) => (
                <SelectItem key={f.name} value={f.name} className="font-bold">
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Pitch */}
        <div className="rounded-xl overflow-hidden border border-border">
          <div
            className="relative w-full"
            style={{
              minHeight: 500,
              background: "linear-gradient(180deg, #082b12 0%, #0c3d1a 40%, #0e4a1f 60%, #082b12 100%)",
            }}
          >
            {/* Mowed stripe texture */}
            <div
              className="absolute inset-0"
              style={{
                background: "repeating-linear-gradient(180deg, transparent 0px, transparent 48px, rgba(0,0,0,0.07) 48px, rgba(0,0,0,0.07) 96px)",
              }}
            />

            {/* Pitch markings */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute inset-4 border border-white/[0.12] rounded-sm" />
              <div className="absolute left-4 right-4 top-1/2 border-t border-white/[0.12]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border border-white/[0.12]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/20" />
              <div className="absolute top-4 left-1/2 -translate-x-1/2 border border-white/[0.12] border-t-0" style={{ width: 160, height: 80 }} />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 border border-white/[0.12] border-b-0" style={{ width: 160, height: 80 }} />
              <div className="absolute top-4 left-1/2 -translate-x-1/2 border border-white/[0.08] border-t-0" style={{ width: 80, height: 32 }} />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 border border-white/[0.08] border-b-0" style={{ width: 80, height: 32 }} />
              <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/15" style={{ top: "17%" }} />
              <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/15" style={{ bottom: "17%" }} />
            </div>

            {/* Player rows */}
            <div className="relative z-10 flex flex-col justify-around py-8 gap-1" style={{ minHeight: 500 }}>
              {rowSlots.map((indices, rowIdx) => (
                <div key={rowIdx} className="flex justify-evenly items-center w-full px-4">
                  {indices.map((slotIdx) => {
                    const slotId = `starter:${slotIdx}`;
                    const playerId = state.starters[slotIdx];
                    return (
                      <Slot
                        key={slotIdx}
                        slotId={slotId}
                        position={starterPositions[slotIdx]}
                        player={playerId ? playerById.get(playerId) : undefined}
                        isValid={isValidForSlot(slotId)}
                        isDraggingAny={isDraggingAny}
                        isSelected={selectedPlayerId === playerId && !!playerId}
                        isSelectionActive={isSelectionActive}
                        isValidForSelection={isValidForSelection(slotId)}
                        onSlotClick={() => handleSlotClick("starter", slotIdx, playerId ?? null)}
                        onRemove={() => removeStarter(slotIdx)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bench */}
        <div className="card-gamer p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
              Banco de Reservas
            </h2>
            <span className="text-xs text-muted-foreground font-display">{filledBench}/11</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {state.bench.map((id, i) => {
              const slotId = `bench:${i}`;
              return (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <Slot
                    slotId={slotId}
                    position="BAN"
                    player={id ? playerById.get(id) : undefined}
                    isValid={isValidForSlot(slotId)}
                    isDraggingAny={isDraggingAny}
                    isSelected={selectedPlayerId === id && !!id}
                    isSelectionActive={isSelectionActive}
                    isValidForSelection={isValidForSelection(slotId)}
                    compact
                    showPosition={false}
                    onSlotClick={() => handleSlotClick("bench", i, id ?? null)}
                    onRemove={() => removeBench(i)}
                  />
                  <span className="text-[9px] font-display text-muted-foreground">{i + 1}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reserves */}
        <div className="card-gamer p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
              Reservas
            </h2>
            {reservePlayers.length > 0 && (
              <span className="text-xs font-display font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {reservePlayers.length}
              </span>
            )}
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : reservePlayers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todos os jogadores estão escalados.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
              {reservePlayers
                .slice()
                .sort((a, b) => (POSITION_ORDER[a.position] ?? 99) - (POSITION_ORDER[b.position] ?? 99) || b.ovr - a.ovr)
                .map((p) => {
                  const c = SLOT_COLORS[p.position] ?? FALLBACK_COLORS;
                  const isBeingDragged = activePlayerId === p.id;
                  return (
                    <Draggable key={p.id} id={p.id}>
                      <div
                        onClick={() => setSelectedPlayerId((prev) => prev === p.id ? null : p.id)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-md border transition-all cursor-grab active:cursor-grabbing ${
                          isBeingDragged
                            ? "opacity-30 border-border/40 bg-background/20"
                            : selectedPlayerId === p.id
                            ? "border-primary/60 bg-primary/10 ring-1 ring-primary/40"
                            : isSelectionActive
                            ? "opacity-40 border-border/40 bg-background/20"
                            : "bg-background/40 border-border/60 hover:border-border hover:bg-background/60"
                        }`}
                      >
                        <span className={`text-[9px] font-display font-bold px-1.5 py-0.5 rounded tracking-widest shrink-0 ${c.badge}`}>
                          {p.position}
                        </span>
                        <span className="flex-1 text-sm text-foreground/90 font-medium truncate">{p.name}</span>
                        <span className={`text-sm font-display font-bold shrink-0 ${c.text}`}>{p.ovr}</span>
                      </div>
                    </Draggable>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Drag overlay — floating card that follows cursor */}
      <DragOverlay dropAnimation={null}>
        {activePlayer ? (
          <PlayerCard player={activePlayer} overlay />
        ) : null}
      </DragOverlay>

      {/* Player selection dialog (fallback for + button) */}
      <Dialog open={!!selectingSlot} onOpenChange={(open) => !open && setSelectingSlot(null)}>
        <DialogContent className="max-w-sm max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display tracking-tight">
              Selecionar Jogador
              {selectingSlot?.type === "starter" && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  — {starterPositions[selectingSlot.index]}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {availableForSelection.length === 0
                ? "Nenhum jogador disponível para esta posição."
                : `${availableForSelection.length} disponível${availableForSelection.length !== 1 ? "eis" : ""}`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto mt-1 space-y-0.5 pr-1">
            {availableForSelection
              .slice()
              .sort((a, b) => b.ovr - a.ovr)
              .map((p) => {
                const c = SLOT_COLORS[p.position] ?? FALLBACK_COLORS;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPlayer(p)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-card border border-transparent hover:border-border transition-all text-left"
                  >
                    <span className={`text-[9px] font-display font-bold px-1.5 py-0.5 rounded tracking-widest shrink-0 ${c.badge}`}>
                      {p.position}
                    </span>
                    <span className="flex-1 text-sm text-foreground truncate">{p.name}</span>
                    <span className={`text-sm font-display font-bold shrink-0 ${c.text}`}>{p.ovr}</span>
                  </button>
                );
              })}
          </div>
        </DialogContent>
      </Dialog>
    </DndContext>
  );
};

export default FieldScreen;
