"use client";

import { useRouter } from "next/navigation";
import { CustomerForm } from "@/components/cash-pos/customer-form";

export default function NewCustomerPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/dashboard/cash-pos/customers");
  };

  const handleCancel = () => {
    router.back();
  };

  return <CustomerForm onSuccess={handleSuccess} onCancel={handleCancel} />;
}