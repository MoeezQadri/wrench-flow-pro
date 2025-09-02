
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { InvoiceFormWithLoader } from "@/components/InvoiceFormWithLoader";

const NewInvoice = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link to="/invoices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">New Invoice</h1>
      </div>

      <InvoiceFormWithLoader />
    </div>
  );
};

export default NewInvoice;
