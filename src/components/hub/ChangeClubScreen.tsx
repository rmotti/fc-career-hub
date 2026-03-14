import { useState } from "react";
import { Check, Shield, Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useClubs } from "@/hooks/useClubs";
import { useChangeClub } from "@/hooks/useClubStints";
import { extractErrorMessage } from "@/services/api";
import { CLUBS_BY_LEAGUE } from "@/utils/leagues";

interface Props {
  saveId: string;
  currentClub: string;
}

const ChangeClubScreen = ({ saveId, currentClub }: Props) => {
  const [selected, setSelected] = useState<string | null>(null);
  const { data: allClubs = [], isLoading } = useClubs();
  const changeClub = useChangeClub();

  const handleConfirm = () => {
    if (!selected) return;
    changeClub.mutate({ saveId, club: selected }, {
      onSuccess: () => {
        toast.success(`Agora você gerencia o ${selected}!`, { duration: 3000 });
        setSelected(null);
      },
      onError: (err) => toast.error(extractErrorMessage(err), { duration: 5000 }),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
        <Loader2 size={20} className="animate-spin" /> Carregando clubes...
      </div>
    );
  }

  // Grupos de clubes separados por liga
  const availableClubs = allClubs.filter(c => c !== currentClub);
  
  const groupedClubs = Object.entries(CLUBS_BY_LEAGUE).map(([league, leagueClubs]) => ({
    league,
    clubs: leagueClubs.filter(c => availableClubs.includes(c))
  })).filter(group => group.clubs.length > 0);

  // Adicionar "Outros" para clubes que não estão no dicionário, se houver
  const knownClubs = new Set(Object.values(CLUBS_BY_LEAGUE).flat());
  const otherClubs = availableClubs.filter(c => !knownClubs.has(c));
  if (otherClubs.length > 0) {
    groupedClubs.push({ league: "Outras Ligas", clubs: otherClubs });
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">Mudar de Clube</h2>
      <p className="text-sm text-muted-foreground">
        Selecione um novo clube para gerenciar. Seu histórico global será mantido.
      </p>

      <div className="space-y-8">
        {groupedClubs.map(({ league, clubs }) => (
          <div key={league} className="space-y-4">
            <h3 className="font-display text-lg font-semibold flex items-center gap-2 border-b border-border pb-2">
              <Trophy size={18} className="text-primary" />
              {league}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {clubs.map((club) => (
                <button
                  key={club}
                  onClick={() => setSelected(club)}
                  className={`card-gamer p-4 flex items-center gap-3 transition-all text-left ${
                    selected === club
                      ? "border-primary glow-primary bg-primary/5"
                      : "hover:border-muted-foreground/30"
                  }`}
                >
                  <Shield size={20} className={selected === club ? "text-primary" : "text-muted-foreground"} />
                  <span className="font-medium text-sm truncate">{club}</span>
                  {selected === club && <Check size={16} className="text-primary ml-auto flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <button
          onClick={handleConfirm}
          disabled={changeClub.isPending}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md font-display font-semibold text-sm hover:opacity-90 transition-opacity animate-pulse-glow disabled:opacity-50"
        >
          {changeClub.isPending ? "Transferindo..." : `Assinar com ${selected}`}
        </button>
      )}
    </div>
  );
};

export default ChangeClubScreen;
