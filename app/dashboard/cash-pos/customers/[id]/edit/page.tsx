"use client";

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CustomerForm } from "@/components/cash-pos/customer-form";
import { getCashCustomers } from "@/lib/actions/cash/customers";
import { toast } from "sonner";

interface CustomerItem {
  id: number;
  name: string;
  nationalId: string;
  createdAt: Date;
  createdBy: string;
}

interface EditCustomerPageProps {
  params: {
    id: string;
  };
}

export default function EditCustomerPage({ params }: EditCustomerPageProps) {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomer();
  }, [params.id]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const customerId = parseInt(params.id);

      if (isNaN(customerId)) {
        toast.error("ID de cliente inválido");
        router.push("/dashboard/cash-pos/customers");
        return;
      }

      // Get all customers and find the one with the matching ID
      const result = await getCashCustomers();

      if (result.success && result.data) {
        const foundCustomer = result.data.find(c => c.id === customerId);
        if (foundCustomer) {
          setCustomer(foundCustomer);
        } else {
          toast.error("Cliente no encontrado");
          router.push("/dashboard/cash-pos/customers");
        }
      } else {
        toast.error(result.error || "Error al cargar el cliente");
        router.push("/dashboard/cash-pos/customers");
      }
    } catch (error) {
      console.error("Error loading customer:", error);
      toast.error("Error inesperado al cargar el cliente");
      router.push("/dashboard/cash-pos/customers");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push("/dashboard/cash-pos/customers");
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando cliente...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null; // Will redirect
  }

  return (
    <CustomerForm
      initialData={customer}
      isEditing={true}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}