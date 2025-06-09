
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import InvoiceForm from "@/components/InvoiceForm";
import { toast } from "sonner";
import { Invoice, InvoiceStatus } from "@/types";
import { useDataContext } from "@/context/data/DataContext";

const EditInvoice = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const {
    getInvoiceById,
  } = useDataContext()
  useEffect(() => {
    const fetchInvoice = async () => {
      if (id) {
        try {
          // Fetch the invoice by ID from Supabase
          const foundInvoice = await getInvoiceById(id);

          if (foundInvoice) {
            // Check if invoice status allows editing
            const canEdit = ['open', 'in-progress', 'completed', 'partial'].includes(foundInvoice.status);

            if (!canEdit) {
              toast.error("This invoice cannot be edited in its current status.");
              navigate("/invoices");
              return;
            }

            // Ensure the found invoice matches the expected type by making required fields explicit
            const typedInvoice: Invoice = {
              ...foundInvoice,
              notes: foundInvoice.notes || '', // Ensure notes is never undefined
              payments: foundInvoice.payments?.map(payment => ({
                ...payment,
                notes: payment.notes || '' // Ensure payment notes is never undefined
              })) || []
            };

            setInvoice(typedInvoice);
          } else {
            toast.error("Invoice not found.");
            navigate("/invoices");
          }
        } catch (error) {
          console.error("Error loading invoice:", error);
          toast.error("Failed to load invoice. Please try again.");
          navigate("/invoices");
        }
      }

      setLoading(false);
    };

    fetchInvoice();
  }, [id, navigate]);

  if (loading) {
    return <div className="p-6">Loading invoice...</div>;
  }

  if (!invoice) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link to="/invoices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Edit Invoice #{invoice.id}</h1>
      </div>

      <InvoiceForm isEditing={true} invoiceData={invoice} />
    </div>
  );
};

export default EditInvoice;
