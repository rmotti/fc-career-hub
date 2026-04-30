import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Plus, RotateCcw, Search, X } from "lucide-react";
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
import { getAlternativePositions, playerCanPlayPosition } from "@/utils/playerPositions";
import Flag from "react-world-flags";
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
import { ScrollArea } from "@/components/ui/scroll-area";

// ── Formation definitions ──────────────────────────────────────────────────

type FormationDef = { name: string; rows: string[][] };

const FORMATIONS: FormationDef[] = [
  { name: "3-3-3-1",        rows: [["GOL"], ["ZAG","ZAG","ZAG"], ["VOL","MC","VOL"], ["PE","MEI","PD"], ["ATA"]] },
  { name: "3-4-2-1",        rows: [["GOL"], ["ZAG","ZAG","ZAG"], ["LE","MC","MC","LD"], ["MEI","MEI"], ["ATA"]] },
  { name: "3-4-3",          rows: [["GOL"], ["ZAG","ZAG","ZAG"], ["LE","MC","MC","LD"], ["PE","ATA","PD"]] },
  { name: "3-5-2",          rows: [["GOL"], ["ZAG","ZAG","ZAG"], ["LE","VOL","MC","VOL","LD"], ["ATA","ATA"]] },
  { name: "4-1-2-1-2",      rows: [["GOL"], ["LE","ZAG","ZAG","LD"], ["VOL"], ["MC","MC"], ["MEI"], ["ATA","ATA"]] },
  { name: "4-1-4-1",        rows: [["GOL"], ["LE","ZAG","ZAG","LD"], ["VOL"], ["ME","MC","MC","MD"], ["ATA"]] },
  { name: "4-2-3-1",        rows: [["GOL"], ["LE","ZAG","ZAG","LD"], ["VOL","VOL"], ["ME","MEI","MD"], ["ATA"]] },
  { name: "4-3-2-1",        rows: [["GOL"], ["LE","ZAG","ZAG","LD"], ["VOL","MC","MC"], ["MEI","MEI"], ["ATA"]] },
  { name: "4-3-3",          rows: [["GOL"], ["LE","ZAG","ZAG","LD"], ["VOL","MC","MC"], ["PE","ATA","PD"]] },
  { name: "4-3-3 Falso 9",  rows: [["GOL"], ["LE","ZAG","ZAG","LD"], ["VOL","MC","MC"], ["PE","SA","PD"]] },
  { name: "4-4-1-1",        rows: [["GOL"], ["LE","ZAG","ZAG","LD"], ["ME","MC","MC","MD"], ["SA"], ["ATA"]] },
  { name: "4-4-2",          rows: [["GOL"], ["LE","ZAG","ZAG","LD"], ["ME","MC","MC","MD"], ["ATA","ATA"]] },
  { name: "4-4-2 Diamante", rows: [["GOL"], ["LE","ZAG","ZAG","LD"], ["VOL"], ["MC","MC"], ["MEI"], ["ATA","ATA"]] },
  { name: "4-5-1",          rows: [["GOL"], ["LE","ZAG","ZAG","LD"], ["ME","VOL","MC","VOL","MD"], ["ATA"]] },
  { name: "5-2-3",          rows: [["GOL"], ["LE","ZAG","ZAG","ZAG","LD"], ["VOL","MC"], ["PE","ATA","PD"]] },
  { name: "5-3-2",          rows: [["GOL"], ["LE","ZAG","ZAG","ZAG","LD"], ["MC","VOL","MC"], ["ATA","ATA"]] },
  { name: "5-4-1",          rows: [["GOL"], ["LE","ZAG","ZAG","ZAG","LD"], ["ME","MC","MC","MD"], ["ATA"]] },
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

// ── Position validation and editing ────────────────────────────────────────

type PositionFlag = "yellow" | "red" | null;

const FORMATION_POSITIONS = ["GOL", "LE", "ZAG", "LD", "VOL", "ME", "MC", "MEI", "MD", "PE", "SA", "ATA", "PD"];

const YELLOW_POSITION_MATCHES: Record<string, string[]> = {
  LD: ["LE", "ZAG"],
  LE: ["LD", "ZAG"],
  ZAG: ["LD", "LE", "VOL"],
  VOL: ["ZAG"],
  MC: ["MEI", "MD", "ME"],
  MEI: ["MC", "SA"],
  MD: ["MC", "MEI", "PD"],
  ME: ["MC", "MEI", "PE"],
  PD: ["PE", "ATA"],
  PE: ["PD", "ATA"],
  ATA: ["PE", "PD"],
  SA: ["MEI"],
};

const NO_FLAG_POSITION_MATCHES: Record<string, string[]> = {
  VOL: ["MC"],
  MC: ["VOL"],
  SA: ["ATA"],
  ATA: ["SA"],
};

const getPositionFlag = (player: ApiPlayer, slotPosition: string): PositionFlag => {
  if (playerCanPlayPosition(player, slotPosition)) return null;
  if ((player.position === "PE" && slotPosition === "ME") || (player.position === "PD" && slotPosition === "MD")) return null;
  if (NO_FLAG_POSITION_MATCHES[player.position]?.includes(slotPosition)) return null;
  if (player.position === "GOL" || slotPosition === "GOL") return "red";
  return YELLOW_POSITION_MATCHES[player.position]?.includes(slotPosition) ? "yellow" : "red";
};

const getPositionFlagRank = (flag: PositionFlag) => {
  if (flag === null) return 0;
  if (flag === "yellow") return 1;
  return 2;
};

const canPlacePlayerInSlot = (player: ApiPlayer, slotPosition: string) => {
  if (slotPosition === "GOL" || player.position === "GOL") return playerCanPlayPosition(player, slotPosition);
  return true;
};

const getPositionFromPitchPoint = (xRatio: number, yRatio: number) => {
  if (yRatio >= 0.88) return "GOL";

  if (yRatio >= 0.72) {
    if (xRatio < 0.28) return "LE";
    if (xRatio > 0.72) return "LD";
    return "ZAG";
  }

  if (yRatio >= 0.58) {
    if (xRatio < 0.24) return "LE";
    if (xRatio > 0.76) return "LD";
    return "VOL";
  }

  if (yRatio >= 0.42) {
    if (xRatio < 0.30) return "ME";
    if (xRatio > 0.70) return "MD";
    return "MC";
  }

  if (yRatio >= 0.28) {
    if (xRatio < 0.25) return "ME";
    if (xRatio > 0.75) return "MD";
    return "MEI";
  }

  if (yRatio >= 0.14) {
    if (xRatio < 0.25) return "PE";
    if (xRatio > 0.75) return "PD";
    return "SA";
  }

  if (xRatio < 0.28) return "PE";
  if (xRatio > 0.72) return "PD";
  return "ATA";
};

const POSITION_POINTS: Record<string, { x: number; y: number }> = {
  GOL: { x: 50, y: 91 },
  LE: { x: 18, y: 76 },
  ZAG: { x: 50, y: 76 },
  LD: { x: 82, y: 76 },
  VOL: { x: 50, y: 62 },
  ME: { x: 24, y: 50 },
  MC: { x: 50, y: 50 },
  MD: { x: 76, y: 50 },
  PE: { x: 24, y: 25 },
  MEI: { x: 50, y: 36 },
  PD: { x: 76, y: 25 },
  SA: { x: 50, y: 22 },
  ATA: { x: 50, y: 10 },
};

const getStarterLayoutPoint = (positions: string[], slotIndex: number) => {
  const position = positions[slotIndex];
  const base = POSITION_POINTS[position] ?? POSITION_POINTS.MC;
  const samePositionIndices = positions
    .map((p, index) => p === position ? index : -1)
    .filter((index) => index !== -1);
  const occurrence = samePositionIndices.indexOf(slotIndex);
  const count = samePositionIndices.length;

  if (count <= 1) return base;

  const spacingByPosition: Record<string, number> = {
    ZAG: 13,
    VOL: 10,
    MC: 11,
    MEI: 10,
    SA: 9,
    ATA: 10,
  };
  const spacing = spacingByPosition[position] ?? 8;
  const offset = (occurrence - (count - 1) / 2) * spacing;
  return { x: Math.min(88, Math.max(12, base.x + offset)), y: base.y };
};

const getDynamicFormationName = (positions: string[]) => {
  const defense = positions.filter((p) => ["LE", "ZAG", "LD"].includes(p)).length;
  const midfield = positions.filter((p) => ["VOL", "ME", "MC", "MEI", "MD"].includes(p)).length;
  const attack = positions.filter((p) => ["PE", "SA", "ATA", "PD"].includes(p)).length;
  return [defense, midfield, attack].filter((count) => count > 0).join("-");
};

const POSITION_ZONE_LABELS = [
  { label: "ATA", x: 50, y: 8 },
  { label: "PE", x: 20, y: 21 },
  { label: "SA", x: 50, y: 21 },
  { label: "PD", x: 80, y: 21 },
  { label: "MEI", x: 50, y: 35 },
  { label: "ME", x: 20, y: 50 },
  { label: "MC", x: 50, y: 50 },
  { label: "MD", x: 80, y: 50 },
  { label: "VOL", x: 50, y: 63 },
  { label: "LE", x: 18, y: 76 },
  { label: "ZAG", x: 50, y: 76 },
  { label: "LD", x: 82, y: 76 },
];

// ── Persistence ────────────────────────────────────────────────────────────

const BENCH_SIZE = 11;

interface FieldState {
  formation: string;
  starters: (string | null)[];
  bench: (string | null)[];
  customPositions?: string[];
  customPoints?: { x: number; y: number }[];
}

function loadState(saveId: string): FieldState {
  try {
    const raw = localStorage.getItem(`field-${saveId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  const positions = FORMATIONS[0].rows.flatMap((r) => r);
  return {
    formation: FORMATIONS[0].name,
    starters: Array(11).fill(null),
    bench: Array(BENCH_SIZE).fill(null),
    customPositions: positions,
    customPoints: positions.map((_, index) => getStarterLayoutPoint(positions, index)),
  };
}

function persistState(saveId: string, state: FieldState) {
  localStorage.setItem(`field-${saveId}`, JSON.stringify(state));
}

// ── Pure player card (display only) ───────────────────────────────────────

const PlayerCard = ({
  player,
  displayPosition = player.position,
  compact = false,
  overlay = false,
  isSelected = false,
  positionFlag = null,
}: {
  player: ApiPlayer;
  displayPosition?: string;
  compact?: boolean;
  overlay?: boolean;
  isSelected?: boolean;
  positionFlag?: PositionFlag;
}) => {
  const c = SLOT_COLORS[displayPosition] ?? SLOT_COLORS[player.position] ?? FALLBACK_COLORS;
  const w = compact ? "w-11" : "w-[48px]";
  const h = compact ? 54 : 58;
  return (
    <div
      className={`${w} border ${c.border} ${c.bg} ${c.glow} rounded-lg flex flex-col items-center justify-center gap-0.5 backdrop-blur-sm select-none transition-all overflow-hidden relative ${overlay ? "rotate-2 scale-105 opacity-95" : ""} ${isSelected ? "brightness-125 scale-105" : ""}`}
      style={{ height: h }}
    >
      {player.nation && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          <Flag
            code={player.nation}
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.3 }}
          />
          <div className="absolute inset-0 bg-black/45" />
        </div>
      )}
      {positionFlag && (
        <span
          className={`absolute right-1 top-1 z-20 flex h-4 w-4 items-center justify-center rounded-full border text-[10px] font-display font-bold leading-none ${
            positionFlag === "yellow"
              ? "border-yellow-300/70 bg-yellow-400 text-black"
              : "border-red-300/80 bg-red-500 text-white"
          }`}
        >
          !
        </span>
      )}
      <span className={`max-w-[42px] truncate text-[7px] font-display font-bold tracking-widest leading-none px-1 py-0.5 rounded ${c.badge} relative z-10`}>
        {displayPosition}
      </span>
      <span className={`font-display font-bold leading-none ${c.text} ${compact ? "text-sm" : "text-lg"} relative z-10`}>
        {player.ovr}
      </span>
      <span className="text-[8px] text-white/65 font-medium leading-none max-w-[44px] text-center truncate px-0.5 relative z-10">
        {player.name.split(" ").slice(-1)[0]}
      </span>
    </div>
  );
};

// ── Draggable wrapper ──────────────────────────────────────────────────────

const Draggable = ({ id, children, disabled = false }: { id: string; children: React.ReactNode; disabled?: boolean }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, disabled });
  return (
    <div
      ref={setNodeRef}
      {...(!disabled ? attributes : {})}
      {...(!disabled ? listeners : {})}
      style={{ opacity: isDragging ? 0 : 1, touchAction: "none", cursor: disabled ? "default" : "grab" }}
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
  positionFlag?: PositionFlag;
  onRemove: () => void;
  onSlotClick: () => void;
  onPositionDrag?: (point: { x: number; y: number }) => void;
  onPositionDragPreviewChange?: (active: boolean) => void;
  onPositionDragPreviewMove?: (point: { x: number; y: number }) => void;
}

const Slot = ({ slotId, position, player, isValid, isDraggingAny, isSelected, isSelectionActive, isValidForSelection, compact, showPosition = true, positionFlag = null, onRemove, onSlotClick, onPositionDrag, onPositionDragPreviewChange, onPositionDragPreviewMove }: SlotProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: slotId });
  const w = compact ? "w-11" : "w-[48px]";
  const h = compact ? 54 : 58;
  const dragStartRef = useRef({ x: 0, y: 0, active: false, suppressClick: false });
  const canDragPosition = !!(showPosition && onPositionDrag && (!player || isSelected));

  useEffect(() => {
    if (!onPositionDrag) return;

    const handleWindowPointerUp = (e: PointerEvent) => {
      if (!dragStartRef.current.active) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      dragStartRef.current.active = false;
      onPositionDragPreviewChange?.(false);

      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
      dragStartRef.current.suppressClick = true;
      onPositionDrag({ x: e.clientX, y: e.clientY });
      window.setTimeout(() => {
        dragStartRef.current.suppressClick = false;
      }, 0);
    };

    const handleWindowPointerCancel = () => {
      dragStartRef.current.active = false;
      onPositionDragPreviewChange?.(false);
    };

    const handleWindowPointerMove = (e: PointerEvent) => {
      if (!dragStartRef.current.active) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) >= 8) {
        dragStartRef.current.suppressClick = true;
      }
      onPositionDragPreviewMove?.({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerCancel);
    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerCancel);
    };
  }, [onPositionDrag, onPositionDragPreviewChange, onPositionDragPreviewMove]);

  const handlePositionPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (!canDragPosition) return;
    dragStartRef.current = { x: e.clientX, y: e.clientY, active: true, suppressClick: false };
    onPositionDragPreviewChange?.(true);
    onPositionDragPreviewMove?.({ x: e.clientX, y: e.clientY });
  };

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
          onPointerDown={canDragPosition ? handlePositionPointerDown : undefined}
          onClick={(e) => {
            if (dragStartRef.current.suppressClick) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            onSlotClick();
          }}
          title={canDragPosition ? "Arraste o card selecionado para mudar a posicao" : undefined}
        >
          <div className={`group transition-opacity ${isSelectionActive && !isSelected && !isValidForSelection ? "opacity-40" : ""}`}>
            <Draggable id={player.id} disabled={canDragPosition}>
              <PlayerCard
                player={player}
                displayPosition={showPosition && playerCanPlayPosition(player, position) ? position : player.position}
                compact={compact}
                isSelected={isSelected}
                positionFlag={positionFlag}
              />
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
        className={`${w} border border-dashed ${emptyBorder} ${ringClass} rounded-lg flex flex-col items-center justify-center gap-1 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,0,0,0.22)]`}
        style={{ height: h }}
        onPointerDown={canDragPosition ? handlePositionPointerDown : undefined}
        title={showPosition ? "Clique para selecionar ou arraste o card para mudar a posicao" : undefined}
      >
        {!isActiveMode ? (
          <button
            onClick={(e) => {
              if (dragStartRef.current.suppressClick) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              onSlotClick();
            }}
            className="flex h-full w-full touch-none select-none flex-col items-center justify-center gap-1"
          >
            <Plus size={compact ? 11 : 13} className="text-white/25" />
            {showPosition && (
              <span className="text-[7px] font-display tracking-widest text-white/25 leading-none">
                {position}
              </span>
            )}
          </button>
        ) : (
          <div
            className="flex flex-col items-center gap-1 w-full h-full justify-center cursor-pointer"
            onClick={(e) => {
              if (dragStartRef.current.suppressClick) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              if (isThisValid) onSlotClick();
            }}
          >
            {isThisValid
              ? <Plus size={compact ? 11 : 13} className={isOver ? "text-primary/80" : "text-primary/50"} />
              : <X size={compact ? 9 : 11} className="text-white/10" />
            }
            {showPosition && isThisValid && (
              <span className={`text-[8px] font-display tracking-widest leading-none ${isOver ? "text-primary/80" : "text-primary/40"}`}>
                {position}
              </span>
            )}
          </div>
        )}
      </div>
      {showPosition && (
        <span className="mt-1 text-[8px] font-display font-bold tracking-widest text-white/35 leading-none">
          {position}
        </span>
      )}
    </div>
  );
};

// ── Main screen ────────────────────────────────────────────────────────────

interface Props { saveId: string }

type SelectingSlot = { type: "starter"; index: number } | { type: "bench"; index: number };
type ReserveFilter = "all" | "goalkeepers" | "defenders" | "midfielders" | "attackers";

const RESERVE_FILTERS: { value: ReserveFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "goalkeepers", label: "GOL" },
  { value: "defenders", label: "DEF" },
  { value: "midfielders", label: "MEI" },
  { value: "attackers", label: "ATA" },
];

const matchesReserveFilter = (player: ApiPlayer, filter: ReserveFilter) => {
  if (filter === "all") return true;
  if (filter === "goalkeepers") return playerCanPlayPosition(player, "GOL");
  if (filter === "defenders") return ["LD", "LE", "ZAG"].some((position) => playerCanPlayPosition(player, position));
  if (filter === "midfielders") return ["VOL", "MC", "ME", "MD", "MEI"].some((position) => playerCanPlayPosition(player, position));
  return ["PE", "PD", "SA", "ATA"].some((position) => playerCanPlayPosition(player, position));
};

const FieldScreen = ({ saveId }: Props) => {
  const { data: players = [], isLoading } = usePlayers(saveId, true);
  const pitchRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<FieldState>(() => loadState(saveId));
  const [selectingSlot, setSelectingSlot] = useState<SelectingSlot | null>(null);
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [reserveSearch, setReserveSearch] = useState("");
  const [reserveFilter, setReserveFilter] = useState<ReserveFilter>("all");
  const [showPositionZones, setShowPositionZones] = useState(false);
  const [previewPosition, setPreviewPosition] = useState<string | null>(null);
  const [previewPoint, setPreviewPoint] = useState<{ x: number; y: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const formation = FORMATIONS.find((f) => f.name === state.formation) ?? FORMATIONS[0];
  const baseStarterPositions = useMemo(() => formation.rows.flatMap((r) => r), [formation]);
  const starterPositions = useMemo(
    () => state.customPositions?.length === 11 ? state.customPositions : baseStarterPositions,
    [state.customPositions, baseStarterPositions]
  );

  const starterSlotLayouts = useMemo(
    () => state.customPoints?.length === 11
      ? state.customPoints
      : starterPositions.map((_, index) => getStarterLayoutPoint(starterPositions, index)),
    [state.customPoints, starterPositions]
  );
  const dynamicFormationName = useMemo(() => getDynamicFormationName(starterPositions), [starterPositions]);

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

  const visibleReservePlayers = useMemo(() => {
    const query = reserveSearch.trim().toLocaleLowerCase();
    return reservePlayers
      .filter((p) => matchesReserveFilter(p, reserveFilter))
      .filter((p) => {
        if (!query) return true;
        return (
          p.name.toLocaleLowerCase().includes(query) ||
          p.position.toLocaleLowerCase().includes(query) ||
          getAlternativePositions(p).some((position) => position.toLocaleLowerCase().includes(query))
        );
      })
      .sort((a, b) => (POSITION_ORDER[a.position] ?? 99) - (POSITION_ORDER[b.position] ?? 99) || b.ovr - a.ovr);
  }, [reservePlayers, reserveFilter, reserveSearch]);

  // Is the currently-dragged player valid for a given slot id?
  const isValidForSlot = useCallback((slotId: string): boolean => {
    if (!activePlayerId) return false;
    const [type, idxStr] = slotId.split(":");
    if (type === "bench") return true;
    const idx = parseInt(idxStr);
    const slotPos = starterPositions[idx];
    const p = playerById.get(activePlayerId);
    return p ? canPlacePlayerInSlot(p, slotPos) : false;
  }, [activePlayerId, starterPositions, playerById]);

  const availableForSelection = useMemo(() => {
    if (!selectingSlot) return [];
    const currentId =
      selectingSlot.type === "starter"
        ? state.starters[selectingSlot.index]
        : state.bench[selectingSlot.index];
    const slotPosition = selectingSlot.type === "starter" ? starterPositions[selectingSlot.index] : null;
    return players.filter((p) => {
      const free = !assignedIds.has(p.id) || p.id === currentId;
      const ok = slotPosition === null || canPlacePlayerInSlot(p, slotPosition);
      return free && ok;
    });
  }, [selectingSlot, players, assignedIds, state, starterPositions]);

  const sortedAvailableForSelection = useMemo(() => {
    if (!selectingSlot) return [];
    if (selectingSlot.type === "bench") {
      return availableForSelection.slice().sort((a, b) => b.ovr - a.ovr);
    }

    const slotPosition = starterPositions[selectingSlot.index];
    return availableForSelection.slice().sort((a, b) => {
      const flagRankDiff = getPositionFlagRank(getPositionFlag(a, slotPosition)) - getPositionFlagRank(getPositionFlag(b, slotPosition));
      if (flagRankDiff !== 0) return flagRankDiff;
      const positionDiff = (POSITION_ORDER[a.position] ?? 99) - (POSITION_ORDER[b.position] ?? 99);
      if (positionDiff !== 0) return positionDiff;
      return b.ovr - a.ovr;
    });
  }, [availableForSelection, selectingSlot, starterPositions]);

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
    const p = playerById.get(selectedPlayerId);
    return p ? canPlacePlayerInSlot(p, slotPos) : false;
  }, [selectedPlayerId, starterPositions, playerById]);

  const placeSelectedPlayer = useCallback((target: { type: "starter" | "bench"; index: number }) => {
    const playerId = selectedPlayerId!;
    const player = playerById.get(playerId);
    if (!player) { setSelectedPlayerId(null); return; }

    if (target.type === "starter") {
      const slotPos = starterPositions[target.index];
      if (!canPlacePlayerInSlot(player, slotPos)) return; // keep selection, let user pick another slot
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
        if (canPlacePlayerInSlot(displacedPlayer, slotPos)) newStarters[fromStarterIdx] = displaced;
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
      if (!canPlacePlayerInSlot(player, slotPos)) return;
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
        if (canPlacePlayerInSlot(displacedPlayer, slotPos)) {
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

  const handleFormationChange = (name: string) => {
    const nextFormation = FORMATIONS.find((f) => f.name === name) ?? FORMATIONS[0];
    const nextPositions = nextFormation.rows.flatMap((r) => r);
    update({
      formation: name,
      starters: Array(11).fill(null),
      customPositions: nextPositions,
      customPoints: nextPositions.map((_, index) => getStarterLayoutPoint(nextPositions, index)),
    });
  };

  const handleClearLineup = () => {
    update({ starters: Array(11).fill(null), bench: Array(BENCH_SIZE).fill(null) });
    setSelectedPlayerId(null);
    setSelectingSlot(null);
  };

  const handleStarterPositionDrag = (index: number, point: { x: number; y: number }) => {
    const next = [...starterPositions];
    const current = next[index];
    if (current === "GOL") return;
    const pitch = pitchRef.current?.getBoundingClientRect();
    if (!pitch) return;

    const xRatio = Math.min(1, Math.max(0, (point.x - pitch.left) / pitch.width));
    const yRatio = Math.min(1, Math.max(0, (point.y - pitch.top) / pitch.height));
    next[index] = getPositionFromPitchPoint(xRatio, yRatio);
    if (next[index] === "GOL") next[index] = current;

    if (FORMATION_POSITIONS.includes(next[index])) {
      const nextPoints = [...starterSlotLayouts];
      nextPoints[index] = {
        x: Math.min(92, Math.max(8, xRatio * 100)),
        y: Math.min(94, Math.max(6, yRatio * 100)),
      };
      update({ customPositions: next, customPoints: nextPoints });
    }
  };

  const getPitchPositionFromPoint = (point: { x: number; y: number }) => {
    const pitch = pitchRef.current?.getBoundingClientRect();
    if (!pitch) return null;
    const xRatio = Math.min(1, Math.max(0, (point.x - pitch.left) / pitch.width));
    const yRatio = Math.min(1, Math.max(0, (point.y - pitch.top) / pitch.height));
    const position = getPositionFromPitchPoint(xRatio, yRatio);
    return position === "GOL" ? null : position;
  };

  const handlePositionPreviewChange = (active: boolean) => {
    setShowPositionZones(active);
    if (!active) {
      setPreviewPosition(null);
      setPreviewPoint(null);
    }
  };

  const handlePositionPreviewMove = (point: { x: number; y: number }) => {
    const pitch = pitchRef.current?.getBoundingClientRect();
    if (!pitch) return;
    const xRatio = Math.min(1, Math.max(0, (point.x - pitch.left) / pitch.width));
    const yRatio = Math.min(1, Math.max(0, (point.y - pitch.top) / pitch.height));
    const position = getPositionFromPitchPoint(xRatio, yRatio);
    setPreviewPosition(position === "GOL" ? null : position);
    setPreviewPoint({
      x: Math.min(92, Math.max(8, xRatio * 100)),
      y: Math.min(94, Math.max(6, yRatio * 100)),
    });
  };

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

  const filledBench = state.bench.filter(Boolean).length;
  const isDraggingAny = activePlayerId !== null;
  const isSelectionActive = selectedPlayerId !== null;

  const activePlayer = activePlayerId ? playerById.get(activePlayerId) : null;

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="mx-auto w-full max-w-[1400px] min-w-0 space-y-4">

        {/* Header */}
        <div data-tour="field-header" className="flex flex-col gap-3 rounded-lg border border-border/80 bg-card/70 px-4 py-3 shadow-[0_14px_36px_rgba(0,0,0,0.18)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">Escalação</h1>
            <p className="text-sm text-muted-foreground">
              Monte titulares, banco e reservas disponíveis.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={state.formation} onValueChange={handleFormationChange}>
              <SelectTrigger className="h-10 w-full min-w-0 bg-background/50 border-border font-display font-bold text-primary sm:w-48">
                <span className="truncate">{dynamicFormationName || state.formation}</span>
              </SelectTrigger>
              <SelectContent className="font-display max-h-72">
                {FORMATIONS.map((f) => (
                  <SelectItem key={f.name} value={f.name} className="font-bold">
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={handleClearLineup}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background/40 px-3 text-sm font-display font-bold text-muted-foreground transition-colors hover:border-destructive/50 hover:text-foreground"
            >
              <RotateCcw size={15} />
              Limpar
            </button>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[244px_minmax(420px,820px)_360px] xl:items-stretch xl:justify-center">
          <div className="contents">
            {/* Pitch */}
            <div data-tour="field-pitch" className="order-1 min-w-0 overflow-hidden rounded-lg border border-emerald-400/20 bg-[#06170d] shadow-[0_18px_50px_rgba(0,0,0,0.24)] xl:order-2">
              <div
                ref={pitchRef}
                className="relative mx-auto w-full max-w-[820px]"
                style={{
                  width: "100%",
                  minWidth: "min(100%, 300px)",
                  aspectRatio: "7 / 10",
                  background: "linear-gradient(180deg, #082511 0%, #0c3919 48%, #082511 100%)",
                }}
              >
                {/* Mowed stripe texture */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: "repeating-linear-gradient(180deg, transparent 0px, transparent 54px, rgba(255,255,255,0.035) 54px, rgba(255,255,255,0.035) 108px)",
                  }}
                />

                {/* Pitch markings */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute inset-4 border border-white/[0.14] rounded-sm" />
                  <div className="absolute left-4 right-4 top-1/2 border-t border-white/[0.14]" />
                  <div className="absolute top-1/2 left-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.14]" />
                  <div className="absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20" />
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 border border-white/[0.14] border-t-0" style={{ width: 176, height: 88 }} />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 border border-white/[0.14] border-b-0" style={{ width: 176, height: 88 }} />
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 border border-white/[0.09] border-t-0" style={{ width: 88, height: 34 }} />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 border border-white/[0.09] border-b-0" style={{ width: 88, height: 34 }} />
                </div>

                <div
                  className={`pointer-events-none absolute inset-0 z-10 bg-emerald-950/20 backdrop-blur-[1px] transition-all duration-200 ease-out ${
                    showPositionZones ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <div className="absolute left-0 right-0 top-[14%] border-t border-white/10 transition-opacity duration-200" />
                  <div className="absolute left-0 right-0 top-[28%] border-t border-white/10 transition-opacity duration-200" />
                  <div className="absolute left-0 right-0 top-[42%] border-t border-white/10 transition-opacity duration-200" />
                  <div className="absolute left-0 right-0 top-[58%] border-t border-white/10 transition-opacity duration-200" />
                  <div className="absolute left-0 right-0 top-[72%] border-t border-white/10 transition-opacity duration-200" />
                  <div className="absolute bottom-0 top-0 left-[28%] border-l border-white/10 transition-opacity duration-200" />
                  <div className="absolute bottom-0 top-0 left-[72%] border-l border-white/10 transition-opacity duration-200" />
                  {POSITION_ZONE_LABELS.map((zone) => {
                    const isPreview = previewPosition === zone.label;
                    return (
                        <span
                          key={`${zone.label}-${zone.x}-${zone.y}`}
                          className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded border px-2 py-1 text-[10px] font-display font-bold tracking-widest shadow-[0_0_18px_rgba(34,197,94,0.18)] transition-all duration-150 ease-out ${
                            isPreview
                              ? "scale-125 border-primary bg-primary text-primary-foreground shadow-[0_0_28px_rgba(34,197,94,0.4)]"
                              : "scale-100 border-primary/30 bg-black/45 text-primary"
                          }`}
                          style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
                        >
                          {zone.label}
                        </span>
                    );
                  })}
                  {previewPoint && (
                    <div
                      className="absolute z-0 h-20 w-16 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-primary/60 bg-primary/10 shadow-[0_0_32px_rgba(34,197,94,0.28)] transition-all duration-150 ease-out"
                      style={{
                        left: `${previewPoint.x}%`,
                        top: `${previewPoint.y}%`,
                      }}
                    />
                  )}
                </div>

                {/* Player slots */}
                <div className="absolute inset-0 z-20">
                  {starterPositions.map((slotPosition, slotIdx) => {
                    const slotId = `starter:${slotIdx}`;
                    const playerId = state.starters[slotIdx];
                    const player = playerId ? playerById.get(playerId) : undefined;
                    const layout = starterSlotLayouts[slotIdx];
                    return (
                      <div
                        key={slotIdx}
                        className="absolute -translate-x-1/2 -translate-y-1/2 transition-[left,top,transform,opacity] duration-300 ease-out"
                        style={{ left: `${layout.x}%`, top: `${layout.y}%` }}
                      >
                        <Slot
                          slotId={slotId}
                          position={slotPosition}
                          player={player}
                          isValid={isValidForSlot(slotId)}
                          isDraggingAny={isDraggingAny}
                          isSelected={selectedPlayerId === playerId && !!playerId}
                          isSelectionActive={isSelectionActive}
                          isValidForSelection={isValidForSelection(slotId)}
                          positionFlag={player ? getPositionFlag(player, slotPosition) : null}
                          onPositionDrag={(point) => handleStarterPositionDrag(slotIdx, point)}
                          onPositionDragPreviewChange={handlePositionPreviewChange}
                          onPositionDragPreviewMove={handlePositionPreviewMove}
                          onSlotClick={() => handleSlotClick("starter", slotIdx, playerId ?? null)}
                          onRemove={() => removeStarter(slotIdx)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bench */}
            <section data-tour="field-bench" className="order-2 min-w-0 rounded-lg border border-border bg-card/70 p-4 xl:order-1 xl:sticky xl:top-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                  Banco de Reservas
                </h2>
                <span className="text-xs text-muted-foreground font-display">{filledBench}/11</span>
              </div>
              <ScrollArea scrollbars="both" className="w-full xl:max-h-[420px]" viewportClassName="pb-3 xl:pb-0 xl:pr-4">
                <div className="flex gap-2 xl:grid xl:grid-cols-3 xl:gap-3">
                  {state.bench.map((id, i) => {
                    const slotId = `bench:${i}`;
                    return (
                      <div key={i} className="flex shrink-0 flex-col items-center gap-0.5">
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
              </ScrollArea>
            </section>
          </div>

          {/* Reserves */}
          <aside data-tour="field-reserves" className="order-3 flex min-w-0 flex-col rounded-lg border border-border bg-card/70 p-4 xl:sticky xl:top-4 xl:h-full xl:max-h-[calc(100vh-2rem)]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                Disponíveis
              </h2>
              <span className="text-xs font-display font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {reservePlayers.length}
              </span>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={reserveSearch}
                  onChange={(e) => setReserveSearch(e.target.value)}
                  placeholder="Buscar jogador ou posição"
                  className="h-10 w-full rounded-md border border-border bg-background/50 pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60"
                />
              </div>

              <div className="grid grid-cols-3 gap-1 sm:grid-cols-5">
                {RESERVE_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setReserveFilter(filter.value)}
                    className={`h-8 rounded-md border text-[11px] font-display font-bold transition-colors ${
                      reserveFilter === filter.value
                        ? "border-primary/60 bg-primary/15 text-primary"
                        : "border-border bg-background/35 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <ScrollArea className="mt-4 max-h-[420px] xl:min-h-0 xl:max-h-none xl:flex-1" viewportClassName="pr-2 xl:pr-4" scrollbars="vertical">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : reservePlayers.length === 0 ? (
                <p className="rounded-md border border-border bg-background/35 p-3 text-sm text-muted-foreground">
                  Todos os jogadores estão alocados.
                </p>
              ) : visibleReservePlayers.length === 0 ? (
                <p className="rounded-md border border-border bg-background/35 p-3 text-sm text-muted-foreground">
                  Nenhum jogador encontrado.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {visibleReservePlayers.map((p) => {
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
                          <span className={`max-w-20 truncate text-[9px] font-display font-bold px-1.5 py-0.5 rounded tracking-widest shrink-0 ${c.badge}`}>
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
            </ScrollArea>
          </aside>
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
          <ScrollArea className="mt-1 h-[min(52vh,420px)]" viewportClassName="pr-4" scrollbars="vertical">
            <div className="space-y-0.5">
              {sortedAvailableForSelection.map((p) => {
                const c = SLOT_COLORS[p.position] ?? FALLBACK_COLORS;
                const slotPosition = selectingSlot?.type === "starter" ? starterPositions[selectingSlot.index] : null;
                const flag = slotPosition ? getPositionFlag(p, slotPosition) : null;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPlayer(p)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-card border border-transparent hover:border-border transition-all text-left"
                  >
                    <span className={`max-w-20 truncate text-[9px] font-display font-bold px-1.5 py-0.5 rounded tracking-widest shrink-0 ${c.badge}`}>
                      {p.position}
                    </span>
                    <span className="flex-1 text-sm text-foreground truncate">{p.name}</span>
                    {flag && (
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] font-display font-bold leading-none ${
                          flag === "yellow"
                            ? "border-yellow-300/70 bg-yellow-400 text-black"
                            : "border-red-300/80 bg-red-500 text-white"
                        }`}
                      >
                        !
                      </span>
                    )}
                    <span className={`text-sm font-display font-bold shrink-0 ${c.text}`}>{p.ovr}</span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </DndContext>
  );
};

export default FieldScreen;
