import { type ApiPlayer } from "@/services/api";

export interface PlayerBadge {
  label: string;
  icon: string;
  color: string;
}

export type SquadRole = "artilheiro" | "garçom" | "motor";

export function getBadge(player: Pick<ApiPlayer, "ovr" | "potential" | "age" | "ovrDelta">, squadRole?: SquadRole): PlayerBadge | null {
  const { ovr, potential, age, ovrDelta } = player;

  if (ovr >= 88)
    return { label: "Elite", icon: "🌟", color: "#F0C040" };

  if (squadRole === "artilheiro")
    return { label: "Artilheiro", icon: "⚽", color: "#E74C3C" };

  if (squadRole === "garçom")
    return { label: "Garçom", icon: "🎯", color: "#3498DB" };

  if (squadRole === "motor")
    return { label: "Motor", icon: "⚙️", color: "#E67E22" };

  if (potential && ovr >= potential - 2 && ovr >= 85)
    return { label: "Realizado", icon: "✅", color: "#2ECC71" };

  if (ovrDelta != null && ovrDelta >= 5)
    return { label: "Em ascensão", icon: "📈", color: "#3498DB" };

  if (age <= 21 && potential && potential >= 88 && potential < 90)
    return { label: "Promessa", icon: "🔥", color: "#E74C3C" };

  if (age <= 21 && potential && potential >= 90)
    return { label: "Diamante", icon: "💎", color: "#9B59B6" };

  if (age >= 34 && ovr >= 82)
    return { label: "Veterano", icon: "🧊", color: "#95A5A6" };

  return null;
}
