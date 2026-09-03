
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InvoiceFormWithLoader } from "@/components/InvoiceFormWithLoader";
import type { InvoiceStatus } from "@/types";

const NewInvoice = () => {
  const [documentType, setDocumentType] = useState<InvoiceStatus>('open');
  const isEstimate = documentType === 'estimate';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link to="/invoices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{isEstimate ? 'New Estimate' : 'New Invoice'}</h1>
      </div>

      <div className="max-w-sm space-y-2">
        <Label htmlFor="document-type">Document type</Label>
        <Select value={documentType} onValueChange={(value: InvoiceStatus) => setDocumentType(value)}>
          <SelectTrigger id="document-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Invoice</SelectItem>
            <SelectItem value="estimate">Estimate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <InvoiceFormWithLoader initialStatus={documentType} />
    </div>
  );
};

export default NewInvoice;
