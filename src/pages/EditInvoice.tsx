
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import InvoiceForm from "@/components/InvoiceForm";
import { toast } from "sonner";
import { Invoice } from "@/types";
import { useDataContext } from "@/context/data/DataContext";
import { useSmartDataLoading } from "@/hooks/useSmartDataLoading";

const EditInvoice = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const { getInvoiceById, loadInvoices, loadCustomers } = useDataContext();
  const { smartLoad, isLoaded, resetLoadedState } = useSmartDataLoading();

  useEffect(() => {
    const fetchInvoice = async () => {
      if (id) {
        try {
          console.log("Fetching invoice with ID:", id);
          
          // Always force reload invoices to get the latest data when editing
          const loadPromises = [];
          
          if (loadInvoices) {
            console.log('Force reloading invoices for fresh edit data');
            resetLoadedState('invoices'); // Reset cache to force reload
            loadPromises.push(smartLoad('invoices', loadInvoices, true)); // Force reload
          }
          
          if (!isLoaded('customers') && loadCustomers) {
            loadPromises.push(smartLoad('customers', loadCustomers));
          }
          
          if (loadPromises.length > 0) {
            console.log('Loading data for editing...');
            await Promise.all(loadPromises);
          }
          
          console.log('Smart data loading completed');
          
          // Find the invoice in the context invoices array
          const foundInvoice = getInvoiceById(id);
          console.log("Found invoice for editing:", foundInvoice);

          if (foundInvoice) {
            // Check if invoice status allows editing
            const canEdit = ['open', 'in-progress', 'partial', 'draft'].includes(foundInvoice.status);

            if (!canEdit) {
              toast.error("This invoice cannot be edited in its current status.");
              navigate("/invoices");
              return;
            }

            // Ensure the found invoice matches the expected type by making required fields explicit
            const typedInvoice: Invoice = {
              ...foundInvoice,
              notes: foundInvoice.notes || '', // Ensure notes is never undefined
              items: foundInvoice.items || [], // Ensure items is never undefined
              payments: foundInvoice.payments?.map(payment => ({
                ...payment,
                notes: payment.notes || '' // Ensure payment notes is never undefined
              })) || []
            };

            setInvoice(typedInvoice);
          } else {
            console.error("Invoice not found:", id);
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
  }, [id]); // Only depend on id to prevent infinite loops

  if (loading) {
    return <div className="p-6">Loading invoice...</div>;
  }

  if (!invoice) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Invoice not found</h2>
          <p className="text-gray-600 mb-4">The invoice you're trying to edit doesn't exist.</p>
          <Button asChild>
            <Link to="/invoices">Back to Invoices</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link to="/invoices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Edit Invoice #{invoice.id.substring(0, 8)}</h1>
      </div>

      <InvoiceForm isEditing={true} invoiceData={invoice} />
    </div>
  );
};

export default EditInvoice;
