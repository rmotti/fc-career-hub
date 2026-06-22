import type { ApiPlaybook, Fc26Player } from "@/shared/api/client";
import type { ShortlistPositionGroup } from "@/features/scout/ui/types";
import { ShortlistContent } from "@/features/scout/ui/components/shortlist";

interface ShortlistSectionProps {
  players: Fc26Player[];
  groups: ShortlistPositionGroup[];
  comparedPlayers: Fc26Player[];
  comparedPlayerIds: Set<number>;
  activePlaybook: ApiPlaybook | null;
  onToggleCompare: (player: Fc26Player) => void;
  onClearComparison: () => void;
  onOpenComparison: () => void;
  onOpenDetails: (sofifaId: number) => void;
  onRemovePlayer: (sofifaId: number) => void;
  onCompareGroup: (players: Fc26Player[]) => void;
  onGoToSearch: () => void;
}

export function ShortlistSection({ onGoToSearch, ...rest }: ShortlistSectionProps) {
  return <ShortlistContent {...rest} onGoToScout={onGoToSearch} />;
}
