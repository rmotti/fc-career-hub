import { Shield, Calendar } from "lucide-react";
import type { UserPlan } from "@/services/api";

interface HubHeaderProps {
  saveName: string;
  userName: string;
  userPlan: UserPlan;
  clubName: string;
  season: string;
  availableSeasons?: string[];
  selectedSeason?: string;
  onSeasonChange?: (season: string) => void;
}

const HubHeader = ({ saveName, userName, userPlan, clubName, season, availableSeasons, selectedSeason, onSeasonChange }: HubHeaderProps) => {
  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between pl-14 md:pl-6 pr-6">
      <div className="flex items-center gap-4">
        <h1 className="font-display text-lg font-semibold text-foreground truncate max-w-[150px] sm:max-w-none">{saveName}</h1>
        <div className="h-5 w-px bg-border hidden sm:block" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield size={16} className="text-primary" />
          <span className="text-foreground font-medium">{clubName}</span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="hidden text-right sm:block">
          <p className="font-medium text-foreground">{userName}</p>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Plano {userPlan}</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} />
          {availableSeasons && availableSeasons.length > 1 && onSeasonChange ? (
            <select
              value={selectedSeason ?? season}
              onChange={e => onSeasonChange(e.target.value)}
              className="bg-transparent border-none text-sm text-foreground focus:outline-none cursor-pointer"
            >
              {availableSeasons.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          ) : (
            <span>{season}</span>
          )}
        </div>
      </div>
    </header>
  );
};

export default HubHeader;
