import { useState, useMemo } from "react";
import { ChevronDown, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import type { PlayerPosition } from "@/shared/api/client";
import { Input } from "@/shared/ui/input";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { ATTRIBUTE_FILTER_GROUPS } from "@/features/scout/config/attributeFilters";
import { sanitizeNumberInput } from "@/features/scout/lib/filters";
import { formatPosition, POSITION_LABELS } from "@/shared/lib/playerPositions";

export function PositionFilterGrid({
  title,
  description,
  positions,
  selected,
  onToggle,
  onClear,
}: {
  title: string;
  description: string;
  positions: PlayerPosition[];
  selected: PlayerPosition[];
  onToggle: (position: PlayerPosition) => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-md border border-border bg-background/25 p-3">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{title}</label>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="flex shrink-0 items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <X size={12} />
            Remove
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
        {positions.map((position) => {
          const isSelected = selected.includes(position);

          return (
            <button
              key={position}
              type="button"
              onClick={() => onToggle(position)}
              title={POSITION_LABELS[position]}
              className={`h-10 rounded-md border px-2 text-center font-display text-sm font-bold transition-colors ${
                isSelected
                  ? "border-primary/35 bg-primary/12 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.12)]"
                  : "border-border bg-background/35 text-muted-foreground hover:border-primary/25 hover:text-foreground"
              }`}
            >
              {formatPosition(position)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function NumericFilterInput({
  value,
  min,
  max,
  placeholder,
  allowDecimal = false,
  compact = false,
  ariaLabel,
  onChange,
}: {
  value: string;
  min?: number;
  max?: number;
  placeholder: string;
  allowDecimal?: boolean;
  compact?: boolean;
  ariaLabel?: string;
  onChange: (value: string) => void;
}) {
  return (
    <Input
      type="text"
      inputMode={allowDecimal ? "decimal" : "numeric"}
      pattern={allowDecimal ? "[0-9]*[.,]?[0-9]*" : "[0-9]*"}
      value={value}
      min={min}
      max={max}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(event) => onChange(sanitizeNumberInput(event.target.value, allowDecimal))}
      className={
        compact
          ? "h-8 w-full border-border bg-muted px-2 py-1 text-[11px] font-semibold text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
          : "h-10 w-full border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
      }
    />
  );
}

export function FilterNumberInput({
  label,
  value,
  min,
  max,
  placeholder,
  allowDecimal = false,
  onChange,
}: {
  label: string;
  value: string;
  min?: number;
  max?: number;
  placeholder?: string;
  allowDecimal?: boolean;
  onChange: (value: string) => void;
}) {
  const fallbackPlaceholder = label.toLowerCase().includes("max")
    ? (typeof max === "number" ? `Max ${max}` : "Max")
    : (typeof min === "number" ? `Min ${min}` : "Min");

  return (
    <div>
      <label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</label>
      <NumericFilterInput
        value={value}
        min={min}
        max={max}
        placeholder={placeholder ?? fallbackPlaceholder}
        allowDecimal={allowDecimal}
        onChange={onChange}
      />
    </div>
  );
}

export function AttributeRangeFilter({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: { min: string; max: string };
  onChange: (side: "min" | "max", value: string) => void;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_78px_78px] items-center gap-2 rounded-md border border-border bg-background/35 px-3 py-2">
      <label className="truncate text-[11px] font-semibold text-foreground">{label}</label>
      <NumericFilterInput
        compact
        value={value.min}
        min={min}
        max={max}
        placeholder={`Min ${min}`}
        ariaLabel={`${label} mínimo`}
        onChange={(value) => onChange("min", value)}
      />
      <NumericFilterInput
        compact
        value={value.max}
        min={min}
        max={max}
        placeholder={`Max ${max}`}
        ariaLabel={`${label} máximo`}
        onChange={(value) => onChange("max", value)}
      />
    </div>
  );
}

export function AdvancedAttributeFilters({
  open,
  activeCount,
  ranges,
  onToggle,
  onClear,
  onChange,
}: {
  open: boolean;
  activeCount: number;
  ranges: Record<string, { min: string; max: string }>;
  onToggle: () => void;
  onClear: () => void;
  onChange: (field: string, side: "min" | "max", value: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-background/30">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-[58px] w-full items-center justify-between gap-3 px-4 text-left transition-colors hover:bg-muted/25"
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
            <SlidersHorizontal size={16} />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-sm font-bold text-foreground">Advanced filters</span>
            <span className="block truncate text-xs text-muted-foreground">
              {activeCount > 0 ? `${activeCount} atributo${activeCount === 1 ? "" : "s"} filtrado${activeCount === 1 ? "" : "s"}` : "Pace, finishing, passing, defense, physical, mentality and goalkeeper"}
            </span>
          </span>
        </span>
        <ChevronDown size={16} className={`shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-border p-4">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">Set minimum and maximum values only on the attributes that matter for the profile.</p>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                <RotateCcw size={13} />
                Clear attributes
              </button>
            )}
          </div>

          <ScrollArea className="h-[min(58vh,520px)]" viewportClassName="pr-4" scrollbars="vertical">
            <div className="grid gap-3 xl:grid-cols-2">
              {ATTRIBUTE_FILTER_GROUPS.map((group) => {
                const Icon = group.icon;

                return (
                  <div key={group.title} className="rounded-md border border-border bg-card/45 p-3">
                    <div className="mb-3 flex items-center gap-2">
                      <Icon size={15} className="text-primary" />
                      <p className="font-display text-sm font-bold text-foreground">{group.title}</p>
                    </div>
                    <div className="grid gap-2">
                      {group.filters.map((filter) => (
                        <AttributeRangeFilter
                          key={filter.field}
                          label={filter.label}
                          min={filter.min}
                          max={filter.max}
                          value={ranges[filter.field] ?? { min: "", max: "" }}
                          onChange={(side, value) => onChange(filter.field, side, value)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

export function MultiSelectCombobox({
  label,
  placeholder,
  emptyLabel,
  options,
  selected,
  onChange,
  disabled = false,
}: {
  label: string;
  placeholder: string;
  emptyLabel: string;
  options: string[];
  selected: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOptions = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase("pt-BR");
    const selectedKeys = new Set(selected.map((v) => v.trim().toLocaleLowerCase("pt-BR")));

    return options
      .filter((option) => !term || option.trim().toLocaleLowerCase("pt-BR").includes(term))
      .slice(0, 80)
      .map((option) => ({ option, selected: selectedKeys.has(option.trim().toLocaleLowerCase("pt-BR")) }));
  }, [options, searchTerm, selected]);

  const toggleOption = (option: string) => {
    const optionKey = option.trim().toLocaleLowerCase("pt-BR");
    const isSelected = selected.some((item) => item.trim().toLocaleLowerCase("pt-BR") === optionKey);

    if (isSelected) {
      onChange(selected.filter((item) => item.trim().toLocaleLowerCase("pt-BR") !== optionKey));
      return;
    }

    if (disabled) return;

    onChange([...selected, option]);
  };

  return (
    <div className={`relative ${disabled ? "opacity-70" : ""}`}>
      <div className="mb-1 flex items-center justify-between gap-3">
        <label className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</label>
        {selected.length > 0 && !disabled && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => !disabled && setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setOpen(true);
          }}
          className="h-10 w-full rounded-md border border-border bg-muted px-3 pr-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:text-muted-foreground"
        />
        <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      </div>

      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((item) => (
            <button
              key={item}
              type="button"
              disabled={disabled}
              onClick={() => toggleOption(item)}
              className="inline-flex min-h-7 max-w-full items-center gap-1 rounded border border-primary/25 bg-primary/10 px-2 text-xs font-semibold text-primary disabled:cursor-not-allowed"
            >
              <span className="truncate">{item}</span>
              <X size={12} className="shrink-0" />
            </button>
          ))}
        </div>
      )}

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-md border border-border bg-popover shadow-xl">
          <ScrollArea className="h-56" viewportClassName="py-1 pr-3" scrollbars="vertical">
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-3 text-sm text-muted-foreground">{emptyLabel}</p>
            ) : filteredOptions.map(({ option, selected: isSelected }) => (
              <button
                key={option}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => toggleOption(option)}
                className={`flex min-h-9 w-full items-center justify-between gap-3 px-3 text-left text-sm transition-colors ${
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <span className="truncate">{option}</span>
                {isSelected && <span className="shrink-0 text-xs">✓</span>}
              </button>
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
