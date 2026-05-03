interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: boolean;
}

const StatCard = ({ label, value, icon: Icon, accent }: StatCardProps) => {
  return (
    <div className="card-gamer p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-md flex items-center justify-center ${accent ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className={`text-xl font-display font-bold ${accent ? "text-accent" : "text-foreground"}`}>{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
