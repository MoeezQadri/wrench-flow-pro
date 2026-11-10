# Better part and vendor pickers

## What's wrong today
- **Parts:** the "Inventory Part" picker in Add Item is a plain dropdown. With many parts it shows only a few rows, has no search, and squeezes name, selling price and cost onto one line.
- **Vendors:** the vendor pickers (Add Item, Add Part, Add Expense) are the same plain dropdown. It moves around while you scroll and jumps when the list finishes loading or a new vendor is added.

## The better experience: a search-as-you-type picker
One shared picker used for both parts and vendors:
- Click the field and a box opens with a **search bar at the top**; typing narrows the list right away (by name, and for parts also part number).
- The box is **wider and taller** (about the width of the form, up to ~400px high) and stays put; only the list inside scrolls.
- **Parts rows** show two lines: part name on top, then selling price, cost and stock in small grey text, so nothing is cut off.
- A "Create a new part" / "Add new vendor" option sits **pinned at the bottom**, so it's always reachable without scrolling. If your search finds nothing, it offers "Add '<what you typed>'".
- Keyboard works: arrow keys to move, Enter to pick.
- On phones it opens full width.

## Where it changes
- Add/Edit Item: Inventory Part picker and Vendor picker.
- Add/Edit Part: Vendor picker.
- Add/Edit Expense: Vendor picker.

Nothing about saving, prices or costs changes; only how you pick.

## Technical details
- New `src/components/ui/searchable-select.tsx` built on existing `Popover` + `Command` (cmdk): props `options {value,label,sublabel,keywords}`, `value`, `onChange`, `placeholder`, `footerAction {label,onSelect}`. PopoverContent width = trigger width (min 320px), CommandList `max-h-[400px]`, `modal` so it works inside dialogs.
- Replace the `Select` in InvoiceItemForm.tsx (parts ~l.349, vendors ~l.479), PartForm.tsx (~l.282), ExpenseForm.tsx (~l.318, keeps "none" option).
- Footer actions open the existing VendorDialog / "custom" part mode.
