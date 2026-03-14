import { useState } from "react";
import { Check, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useClubs } from "@/hooks/useClubs";
import { useChangeClub } from "@/hooks/useClubStints";

interface Props {
  saveId: string;
  currentClub: string;
}

const ChangeClubScreen = ({ saveId, currentClub }: Props) => {
  const [selected, setSelected] = useState<string | null>(null);
  const { data: allClubs = [], isLoading } = useClubs();
  const changeClub = useChangeClub();

  const clubs = allClubs.filter(c => c !== currentClub);

  const handleConfirm = () => {
    if (!selected) return;
    changeClub.mutate({ saveId, club: selected }, {
      onSuccess: () => {
        toast.success(`Agora você gerencia o ${selected}!`);
        setSelected(null);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
        <Loader2 size={20} className="animate-spin" /> Carregando clubes...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">Mudar de Clube</h2>
      <p className="text-sm text-muted-foreground">
        Selecione um novo clube para gerenciar. Seu histórico global será mantido.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {clubs.map((club) => (
          <button
            key={club}
            onClick={() => setSelected(club)}
            className={`card-gamer p-4 flex items-center gap-3 transition-all text-left ${
              selected === club
                ? "border-primary glow-primary"
                : "hover:border-muted-foreground/30"
            }`}
          >
            <Shield size={20} className={selected === club ? "text-primary" : "text-muted-foreground"} />
            <span className="font-medium text-sm">{club}</span>
            {selected === club && <Check size={16} className="text-primary ml-auto" />}
          </button>
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
