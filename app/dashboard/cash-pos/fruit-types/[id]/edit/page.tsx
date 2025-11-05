"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FruitTypeForm } from "@/components/cash-pos/fruit-type-form";
import { getCashFruitTypes } from "@/lib/actions/cash/fruit-types";
import { Loader2 } from "lucide-react";

export default function EditFruitTypePage() {
  const params = useParams();
  const id = params.id as string;
  const [fruitType, setFruitType] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFruitType();
  }, [id]);

  const loadFruitType = async () => {
    try {
      setLoading(true);
      const result = await getCashFruitTypes({ enabled_only: false });
      if (result.success && result.data) {
        const found = result.data.find((ft: any) => ft.id === parseInt(id));
        if (found) {
          setFruitType(found);
        }
      }
    } catch (error) {
      console.error("Error loading fruit type:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    window.location.href = '/dashboard/cash-pos/fruit-types';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!fruitType) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Tipo de fruta no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <FruitTypeForm
      initialData={fruitType}
      isEditing={true}
      onSuccess={handleSuccess}
    />
  );
}