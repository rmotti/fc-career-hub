type StatusScreenProps = {
  message: string;
};

export function StatusScreen({ message }: StatusScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-muted-foreground animate-pulse font-display text-lg">{message}</div>
    </div>
  );
}

export const AuthStatusScreen = StatusScreen;
