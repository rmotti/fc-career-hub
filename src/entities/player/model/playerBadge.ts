import { type ApiPlayer } from "@/shared/api/client";

export interface PlayerBadge {
  label: string;
  icon: string;
  color: string;
}

export type SquadRole = "scorer" | "playmaker" | "engine";

export function getBadge(player: Pick<ApiPlayer, "ovr" | "potential" | "age" | "ovrDelta">, squadRole?: SquadRole): PlayerBadge | null {
  const { ovr, potential, age, ovrDelta } = player;

  if (ovr >= 88)
    return { label: "Elite", icon: "🌟", color: "#F0C040" };

  if (squadRole === "scorer")
    return { label: "Top Scorer", icon: "⚽", color: "#E74C3C" };

  if (squadRole === "playmaker")
    return { label: "Playmaker", icon: "🎯", color: "#3498DB" };

  if (squadRole === "engine")
    return { label: "Engine", icon: "⚙️", color: "#E67E22" };

  if (ovrDelta != null && ovrDelta >= 5)
    return { label: "Rising", icon: "📈", color: "#3498DB" };

  if (age <= 21 && potential && potential >= 88 && potential < 90)
    return { label: "Prospect", icon: "🔥", color: "#E74C3C" };

  if (age <= 21 && potential && potential >= 92)
    return { label: "Diamond", icon: "💎", color: "#9B59B6" };

  if (age >= 34 && ovr >= 85)
    return { label: "Veteran", icon: "🧊", color: "#95A5A6" };

  return null;
}
