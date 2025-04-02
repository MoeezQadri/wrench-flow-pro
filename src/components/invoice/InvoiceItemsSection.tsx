
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
  const [newItemType, setNewItemType] = useState<"labor" | "part">("labor");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(0);

  // Add new item to invoice
  const handleAddItem = () => {
    if (!newItemDescription || newItemQuantity <= 0 || newItemPrice <= 0) {
      toast.error("Please fill all item details correctly");
      return;
    }

    const newItem: InvoiceItem = {
      id: Date.now().toString(), // Temporary ID
      type: newItemType,
      description: newItemDescription,
      quantity: newItemQuantity,
      price: newItemPrice,
    };

    setItems([...items, newItem]);
    
    // Reset item form
    setNewItemDescription("");
    setNewItemQuantity(1);
    setNewItemPrice(0);
  };

  // Remove item from invoice
  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  // Calculate discount amount
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
        <div className="grid gap-4 md:grid-cols-5">
          <div>
            <FormLabel htmlFor="itemType">Type</FormLabel>
            <Select
              value={newItemType}
              onValueChange={(value: "labor" | "part") => setNewItemType(value)}
            >
              <SelectTrigger id="itemType">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="labor">Labor</SelectItem>
                <SelectItem value="part">Part</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="md:col-span-2">
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
              min="1"
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 0)}
            />
          </div>
          
          <div>
            <FormLabel htmlFor="itemPrice">Price ($)</FormLabel>
            <Input
              id="itemPrice"
              type="number"
              step="0.01"
              min="0"
              value={newItemPrice}
              onChange={(e) => setNewItemPrice(parseFloat(e.target.value) || 0)}
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
              <TableHead>Total</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.type === "labor" ? "Labor" : "Part"}
                </TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>${item.price.toFixed(2)}</TableCell>
                <TableCell>${(item.quantity * item.price).toFixed(2)}</TableCell>
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
              <TableCell colSpan={4} className="text-right font-medium">
                Subtotal
              </TableCell>
              <TableCell className="font-medium">${subtotal.toFixed(2)}</TableCell>
              <TableCell></TableCell>
            </TableRow>
            
            {/* Display discount row if applicable */}
            {discountType !== "none" && discountValue > 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-right font-medium text-red-600">
                  Discount {discountType === "percentage" ? `(${discountValue}%)` : ""}
                </TableCell>
                <TableCell className="font-medium text-red-600">-${discountAmount.toFixed(2)}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            )}
            
            {/* Show subtotal after discount if a discount is applied */}
            {discountType !== "none" && discountValue > 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-right font-medium">
                  Subtotal after discount
                </TableCell>
                <TableCell className="font-medium">${subtotalAfterDiscount.toFixed(2)}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            )}
            
            <TableRow>
              <TableCell colSpan={4} className="text-right font-medium">
                Tax ({taxRate}%)
              </TableCell>
              <TableCell className="font-medium">${tax.toFixed(2)}</TableCell>
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={4} className="text-right text-lg font-bold">
                Total
              </TableCell>
              <TableCell className="text-lg font-bold">${total.toFixed(2)}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      ) : (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No items added yet. Add some items to the invoice.</p>
        </div>
      )}
    </div>
  );
};

export default InvoiceItemsSection;
