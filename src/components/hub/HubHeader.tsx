import { Shield, Calendar } from "lucide-react";

interface HubHeaderProps {
  saveName: string;
  clubName: string;
  season: string;
}

const HubHeader = ({ saveName, clubName, season }: HubHeaderProps) => {
  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="font-display text-lg font-semibold text-foreground">{saveName}</h1>
        <div className="h-5 w-px bg-border" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield size={16} className="text-primary" />
          <span className="text-foreground font-medium">{clubName}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar size={16} />
        <span>{season}</span>
      </div>
    </header>
  );
};

export default HubHeader;
