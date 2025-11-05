"use client";

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ReceptionForm } from "@/components/cash-pos/reception-form";
import { getCashReceptions } from "@/lib/actions/cash/receptions";
import { Loader2 } from "lucide-react";

export default function EditReceptionPage() {
  const params = useParams();
  const id = params.id as string;
  const [reception, setReception] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReception();
  }, [id]);

  const loadReception = async () => {
    try {
      setLoading(true);
      const result = await getCashReceptions({ limit: 1 });
      if (result.success && result.data) {
        const found = result.data.find((r: any) => r.id === parseInt(id));
        if (found) {
          // Transform the data to match the form's expected format
          const formData = {
            id: found.id,
            fruitTypeId: found.fruitTypeId,
            customerId: found.customerId,
            receptionDate: found.receptionDate.toISOString().split('T')[0],
            containersCount: found.containersCount,
            totalWeightKgOriginal: parseFloat(found.totalWeightKgOriginal),
            calidadHumedad: found.calidadHumedad ? parseFloat(found.calidadHumedad) : undefined,
            calidadMoho: found.calidadMoho ? parseFloat(found.calidadMoho) : undefined,
            calidadVioletas: found.calidadVioletas ? parseFloat(found.calidadVioletas) : undefined,
          };
          setReception(formData);
        }
      }
    } catch (error) {
      console.error("Error loading reception:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    window.location.href = '/dashboard/cash-pos/receptions';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!reception) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Recepción no encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <ReceptionForm
      initialData={reception}
      isEditing={true}
      onSuccess={handleSuccess}
    />
  );
}