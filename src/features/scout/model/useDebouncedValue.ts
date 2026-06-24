import { useEffect, useState } from "react";

// Returns `value` delayed by `delayMs`: the result only updates once the input
// has settled for that long, so rapid changes (e.g. keystrokes) collapse into a
// single trailing update instead of one per change.
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);
  return debounced;
}
