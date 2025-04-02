
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, AlertTriangle, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import PartDialog from "@/components/part/PartDialog";
import { parts } from "@/services/data-service";
import { Part } from "@/types";

const Parts = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | undefined>(undefined);
  const [partsList, setPartsList] = useState<Part[]>(parts);

  const handleAddPart = () => {
    setSelectedPart(undefined);
    setIsDialogOpen(true);
  };

  const handleEditPart = (part: Part) => {
    setSelectedPart(part);
    setIsDialogOpen(true);
  };

  const handleSavePart = (part: Part) => {
    setPartsList(prev => {
      const index = prev.findIndex(p => p.id === part.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = part;
        return updated;
      } else {
        return [...prev, part];
      }
    });
  };

  const needsReorder = (part: Part) => {
    return part.reorderLevel !== undefined && part.quantity <= part.reorderLevel;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Parts Inventory</h1>
        <Button onClick={handleAddPart}>
          <Plus className="mr-1 h-4 w-4" />
          Add Part
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Parts List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partsList.map((part) => (
                <TableRow key={part.id}>
                  <TableCell className="font-medium">
                    <div>{part.name}</div>
                    {part.partNumber && (
                      <div className="text-xs text-muted-foreground">#{part.partNumber}</div>
                    )}
                  </TableCell>
                  <TableCell>${part.price.toFixed(2)}</TableCell>
                  <TableCell>{part.quantity}</TableCell>
                  <TableCell>{part.vendorName || "—"}</TableCell>
                  <TableCell>
                    {needsReorder(part) ? (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Reorder
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        In Stock
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditPart(part)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {partsList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <ShoppingBag className="w-12 h-12 mb-2 text-muted-foreground/60" />
                      <p>No parts found</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={handleAddPart}
                      >
                        Add your first part
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PartDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSavePart}
        part={selectedPart}
      />
    </div>
  );
};

export default Parts;
