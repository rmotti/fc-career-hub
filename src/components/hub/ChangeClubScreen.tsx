import { useState } from "react";
import { Check, Shield } from "lucide-react";
import { availableClubs } from "@/data/mockData";

interface Props {
  currentClub: string;
  onChangeClub: (club: string) => void;
}

const ChangeClubScreen = ({ currentClub, onChangeClub }: Props) => {
  const [selected, setSelected] = useState<string | null>(null);
  const clubs = availableClubs.filter(c => c !== currentClub);

  const handleConfirm = () => {
    if (selected) onChangeClub(selected);
  };

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
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md font-display font-semibold text-sm hover:opacity-90 transition-opacity animate-pulse-glow"
        >
          Assinar com {selected}
        </button>
      )}
    </div>
  );
};

export default ChangeClubScreen;
