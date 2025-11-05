"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerList } from "@/components/cash-pos/customer-list";

interface CustomerItem {
  id: number;
  name: string;
  nationalId: string;
  createdAt: Date;
  createdBy: string;
}

export default function CustomersPage() {
  const router = useRouter();
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null);

  const handleCreate = () => {
    router.push("/dashboard/cash-pos/customers/new");
  };

  const handleEdit = (customer: CustomerItem) => {
    router.push(`/dashboard/cash-pos/customers/${customer.id}/edit`);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Clientes de Efectivo</h1>
        <p className="text-muted-foreground mt-2">
          Gestionar clientes que venden frutas por pago en efectivo
        </p>
      </div>

      <CustomerList onCreate={handleCreate} onEdit={handleEdit} />
    </div>
  );
}