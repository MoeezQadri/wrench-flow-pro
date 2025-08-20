import { InvoiceItem } from '@/types';

export const deduplicateItems = (items: InvoiceItem[]): InvoiceItem[] => {
  const seen = new Set<string>();
  const deduplicated: InvoiceItem[] = [];

  items.forEach(item => {
    const key = createItemKey(item);
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(item);
    }
  });

  return deduplicated;
};

export const createItemKey = (item: InvoiceItem): string => {
  if (item.part_id) {
    return `part-${item.part_id}`;
  }
  if (item.task_id) {
    return `task-${item.task_id}`;
  }
  return `custom-${item.type}-${item.description}-${item.price}`;
};

export const hasConflictingItem = (newItem: InvoiceItem, existingItems: InvoiceItem[]): boolean => {
  const newKey = createItemKey(newItem);
  return existingItems.some(item => createItemKey(item) === newKey);
};

export const mergeItemQuantities = (items: InvoiceItem[]): InvoiceItem[] => {
  const itemMap = new Map<string, InvoiceItem>();

  items.forEach(item => {
    const key = createItemKey(item);
    const existing = itemMap.get(key);
    
    if (existing) {
      // Merge quantities for duplicate items
      existing.quantity += item.quantity;
    } else {
      itemMap.set(key, { ...item });
    }
  });

  return Array.from(itemMap.values());
};