import { type ApiPlayer, type ApiTransfer } from "@/services/api";

export function shouldRemovePlayerFromSquad(type: ApiTransfer["type"]): boolean {
  return type === "venda" || type === "emprestimo_saida";
}

export function getSoldPlayerIds(transfers: ApiTransfer[]): Set<string> {
  return new Set(
    transfers
      .filter((transfer) => transfer.type === "venda" && !!transfer.playerId)
      .map((transfer) => transfer.playerId!)
  );
}

export function getActiveSoldPlayers(players: ApiPlayer[], transfers: ApiTransfer[]): ApiPlayer[] {
  const soldPlayerIds = getSoldPlayerIds(transfers);

  return players.filter((player) => player.isActive && soldPlayerIds.has(player.id));
}

export function getInactivePlayersToReactivate(players: ApiPlayer[], transfers: ApiTransfer[]): ApiPlayer[] {
  const soldPlayerIds = getSoldPlayerIds(transfers);

  return players.filter((player) => !player.isActive && !soldPlayerIds.has(player.id));
}
