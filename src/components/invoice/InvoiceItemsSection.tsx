
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InvoiceItem } from "@/types";
import { toast } from "sonner";

interface InvoiceItemsSectionProps {
  items: InvoiceItem[];
  setItems: React.Dispatch<React.SetStateAction<InvoiceItem[]>>;
  subtotal: number;
  discountType: "none" | "percentage" | "fixed";
  discountValue: number;
  taxRate: number;
}

const InvoiceItemsSection = ({
  items,
  setItems,
  subtotal,
  discountType,
  discountValue,
  taxRate,
}: InvoiceItemsSectionProps) => {
  const [newItemType, setNewItemType] = useState<"part" | "labor" | "service">("part");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState<number | "">("");
  const [newItemPrice, setNewItemPrice] = useState<number | "">("");

  // Create a new invoice item
  const handleAddItem = () => {
    if (!newItemType || !newItemDescription || typeof newItemQuantity !== "number" || typeof newItemPrice !== "number") {
      toast.error("Please fill all item fields");
      return;
    }
    
    const newItem: InvoiceItem = {
      id: Date.now().toString(), // Temporary ID
      invoice_id: "", // Will be set when the invoice is created
      type: newItemType,
      description: newItemDescription,
      quantity: newItemQuantity,
      price: newItemPrice,
    };
    
    setItems([...items, newItem]);
    
    // Reset form
    setNewItemType("part");
    setNewItemDescription("");
    setNewItemQuantity("");
    setNewItemPrice("");
  };

  // Remove invoice item
  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  // Calculate discount
  let discountAmount = 0;
  if (discountType === "percentage" && discountValue > 0) {
    discountAmount = subtotal * (discountValue / 100);
  } else if (discountType === "fixed" && discountValue > 0) {
    discountAmount = discountValue;
  }

  // Calculate subtotal after discount
  const subtotalAfterDiscount = subtotal - discountAmount;

  // Calculate tax
  const tax = subtotalAfterDiscount * (taxRate / 100);

  // Calculate total
  const total = subtotalAfterDiscount + tax;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Invoice Items</h3>
      
      {/* Add New Item Form */}
      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <FormLabel htmlFor="itemType">Type</FormLabel>
            <Select
              value={newItemType}
              onValueChange={(value: "part" | "labor" | "service") => 
                setNewItemType(value)
              }
            >
              <SelectTrigger id="itemType">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="part">Part</SelectItem>
                <SelectItem value="labor">Labor</SelectItem>
                <SelectItem value="service">Service</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <FormLabel htmlFor="itemDescription">Description</FormLabel>
            <Input
              id="itemDescription"
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              placeholder="Description"
            />
          </div>
          
          <div>
            <FormLabel htmlFor="itemQuantity">Quantity</FormLabel>
            <Input
              id="itemQuantity"
              type="number"
              step="1"
              min="1"
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(parseFloat(e.target.value) || "")}
              placeholder="Quantity"
            />
          </div>
          
          <div>
            <FormLabel htmlFor="itemPrice">Price ($)</FormLabel>
            <Input
              id="itemPrice"
              type="number"
              step="0.01"
              min="0.01"
              value={newItemPrice}
              onChange={(e) => setNewItemPrice(parseFloat(e.target.value) || "")}
              placeholder="Price"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <Button 
            type="button" 
            onClick={handleAddItem}
            className="flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </Card>
      
      {/* Items Table */}
      {items.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.type}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>${item.price.toFixed(2)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            
            <TableRow>
              <TableCell colSpan={3} className="text-right font-medium">
                Subtotal:
              </TableCell>
              <TableCell className="font-medium">${subtotal.toFixed(2)}</TableCell>
              <TableCell></TableCell>
            </TableRow>
            
            {discountType !== "none" && discountValue > 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-right font-medium">
                  Discount ({discountType === "percentage" ? `${discountValue}%` : "$"+discountValue}):
                </TableCell>
                <TableCell className="font-medium">-${discountAmount.toFixed(2)}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            )}
            
            <TableRow>
              <TableCell colSpan={3} className="text-right font-medium">
                Subtotal After Discount:
              </TableCell>
              <TableCell className="font-medium">${subtotalAfterDiscount.toFixed(2)}</TableCell>
              <TableCell></TableCell>
            </TableRow>
            
            <TableRow>
              <TableCell colSpan={3} className="text-right font-medium">
                Tax ({taxRate}%):
              </TableCell>
              <TableCell className="font-medium">${tax.toFixed(2)}</TableCell>
              <TableCell></TableCell>
            </TableRow>
            
            <TableRow>
              <TableCell colSpan={3} className="text-right font-bold text-lg">
                Total:
              </TableCell>
              <TableCell className="font-bold text-lg">${total.toFixed(2)}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      ) : (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No items added yet. Add items to calculate the invoice total.</p>
        </div>
      )}
    </div>
  );
};

export default InvoiceItemsSection;
