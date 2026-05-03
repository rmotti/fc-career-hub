import { HelpCircle } from "lucide-react";

interface TutorialHelpButtonProps {
  onClick: () => void;
  className?: string;
}

const TutorialHelpButton = ({ onClick, className = "" }: TutorialHelpButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    data-tour="hub-help"
    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-card/70 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 ${className}`}
    aria-label="Abrir tutorial"
    title="Abrir tutorial"
  >
    <HelpCircle size={18} />
  </button>
);

export default TutorialHelpButton;
