"use client";

import { ReceptionForm } from "@/components/cash-pos/reception-form";

export default function NewReceptionPage() {
  const handleSuccess = () => {
    window.location.href = '/dashboard/cash-pos/receptions';
  };

  return <ReceptionForm onSuccess={handleSuccess} />;
}