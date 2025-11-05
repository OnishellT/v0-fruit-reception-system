"use client";

import { FruitTypeForm } from "@/components/cash-pos/fruit-type-form";

export default function NewFruitTypePage() {
  const handleSuccess = () => {
    window.location.href = '/dashboard/cash-pos/fruit-types';
  };

  return <FruitTypeForm onSuccess={handleSuccess} />;
}