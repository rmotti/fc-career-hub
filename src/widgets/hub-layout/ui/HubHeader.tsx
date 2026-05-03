import { Shield, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import TutorialHelpButton from "@/features/tutorial/ui/TutorialHelpButton";
interface HubHeaderProps {
  saveName: string;
  clubName: string;
  season: string;
  availableSeasons?: string[];
  selectedSeason?: string;
  onSeasonChange?: (season: string) => void;
  showSeasonSelector?: boolean;
  onStartTutorial: () => void;
}

const HubHeader = ({
  saveName,
  clubName,
  season,
  availableSeasons,
  selectedSeason,
  onSeasonChange,
  showSeasonSelector = false,
  onStartTutorial,
}: HubHeaderProps) => {
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
      <div className="flex items-center gap-2">
        {showSeasonSelector && (
          <div data-tour="hub-season-selector" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar size={16} />
            {availableSeasons && availableSeasons.length > 1 && onSeasonChange ? (
              <Select value={selectedSeason ?? season} onValueChange={onSeasonChange}>
                <SelectTrigger className="h-9 w-[132px] border-border bg-card font-display text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary/40 focus:ring-primary/20">
                  <SelectValue placeholder={season} />
                </SelectTrigger>
                <SelectContent className="border-border bg-card text-foreground">
                  {availableSeasons.map((availableSeason) => (
                    <SelectItem
                      key={availableSeason}
                      value={availableSeason}
                      className="font-display text-sm font-semibold focus:bg-primary focus:text-primary-foreground"
                    >
                      {availableSeason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="font-display text-sm font-semibold text-foreground">{season}</span>
            )}
          </div>
        )}
        <TutorialHelpButton onClick={onStartTutorial} />
      </div>
    </header>
  );
};

export default HubHeader;
