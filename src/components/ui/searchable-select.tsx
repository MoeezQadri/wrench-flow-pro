import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export interface SearchableOption {
  value: string;
  label: string;
  description?: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  /** Optional server-side search. Results are merged with the local options. */
  onSearch?: (term: string) => Promise<SearchableOption[]>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  loading?: boolean;
  /** Fallback label when the selected value isn't in options yet */
  selectedLabel?: string;
  id?: string;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  onSearch,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found",
  disabled = false,
  loading = false,
  selectedLabel,
  id,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [term, setTerm] = React.useState("");
  const [remote, setRemote] = React.useState<SearchableOption[]>([]);
  const [searching, setSearching] = React.useState(false);

  // Debounced server-side search
  React.useEffect(() => {
    if (!onSearch) return;
    const trimmed = term.trim();
    if (trimmed.length < 2) {
      setRemote([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const results = await onSearch(trimmed);
        if (!cancelled) setRemote(results);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [term, onSearch]);

  const merged = React.useMemo(() => {
    const map = new Map<string, SearchableOption>();
    options.forEach((o) => map.set(o.value, o));
    remote.forEach((o) => {
      if (!map.has(o.value)) map.set(o.value, o);
    });
    return Array.from(map.values());
  }, [options, remote]);

  const filtered = React.useMemo(() => {
    const trimmed = term.trim().toLowerCase();
    if (!trimmed) return merged;
    return merged.filter(
      (o) =>
        o.label.toLowerCase().includes(trimmed) ||
        (o.description || "").toLowerCase().includes(trimmed)
    );
  }, [merged, term]);

  const current = merged.find((o) => o.value === value);
  const triggerLabel = current?.label || selectedLabel || placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !current && !selectedLabel && "text-muted-foreground"
          )}
        >
          <span className="truncate">{loading ? "Loading..." : triggerLabel}</span>
          {loading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={term}
            onValueChange={setTerm}
          />
          <CommandList>
            {searching && (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Searching...
              </div>
            )}
            {!searching && filtered.length === 0 && <CommandEmpty>{emptyText}</CommandEmpty>}
            <CommandGroup>
              {filtered.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                    setTerm("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="min-w-0">
                    <p className="truncate">{option.label}</p>
                    {option.description && (
                      <p className="truncate text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default SearchableSelect;
