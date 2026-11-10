import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";

export interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
  keywords?: string[];
}

interface Props {
  options: SearchableOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  footerAction?: { label: string; onSelect: (search: string) => void };
  id?: string;
  className?: string;
  disabled?: boolean;
}

export const SearchableSelect = React.forwardRef<HTMLButtonElement, Props>(
  ({ options, value, onChange, placeholder = "Select…", searchPlaceholder = "Search…", emptyText = "Nothing found.", footerAction, id, className, disabled }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const selected = options.find((o) => o.value === value);

    return (
      <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch(""); }} modal>
        <PopoverTrigger asChild>
          <Button ref={ref} id={id} type="button" variant="outline" role="combobox" aria-expanded={open} disabled={disabled}
            className={cn("w-full justify-between font-normal", !selected && "text-muted-foreground", className)}>
            <span className="truncate">{selected ? selected.label : placeholder}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[min(320px,calc(100vw-2rem))] max-w-[calc(100vw-2rem)]">
          <Command>
            <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
            <CommandList className="max-h-[min(400px,50vh)]">
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((o) => (
                  <CommandItem key={o.value} value={`${o.label} ${o.value}`} keywords={o.keywords}
                    onSelect={() => { onChange(o.value); setOpen(false); }}>
                    <Check className={cn("mr-2 h-4 w-4 shrink-0", value === o.value ? "opacity-100" : "opacity-0")} />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate">{o.label}</span>
                      {o.sublabel && <span className="truncate text-xs text-muted-foreground">{o.sublabel}</span>}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            {footerAction && (
              <>
                <CommandSeparator />
                <div className="p-1">
                  <Button type="button" variant="ghost" className="w-full justify-start"
                    onClick={() => { const s = search; setOpen(false); setSearch(""); footerAction.onSelect(s); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    {search ? `${footerAction.label}: "${search}"` : footerAction.label}
                  </Button>
                </div>
              </>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);
SearchableSelect.displayName = "SearchableSelect";
