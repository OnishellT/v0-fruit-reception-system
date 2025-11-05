"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Save } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface FruitType {
  id: string;
  type: string;
  subtype: string;
}

interface DailyPriceFormProps {
  fruitTypes: FruitType[];
  onSuccess?: () => void;
}

export function DailyPriceForm({ fruitTypes, onSuccess }: DailyPriceFormProps) {
  const [formData, setFormData] = useState({
    fruitTypeId: "",
    priceDate: format(new Date(), "yyyy-MM-dd"),
    pricePerKg: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await fetch("/api/pricing/daily", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          fruit_type_id: formData.fruitTypeId,
          price_date: formData.priceDate,
          price_per_kg: parseFloat(formData.pricePerKg),
        }),
      });

      const data = await result.json();

      if (data.success) {
        toast.success("Precio diario establecido correctamente");

        // Reset form on success
        setFormData({
          fruitTypeId: "",
          priceDate: format(new Date(), "yyyy-MM-dd"),
          pricePerKg: "",
        });
        onSuccess?.();
      } else {
        toast.error(data.error || "Error al establecer el precio");
      }
    } catch (error) {
      console.error("Error setting price:", error);
      toast.error("Error al establecer el precio");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Establecer Precio Diario</CardTitle>
        <CardDescription>
          Configure el precio para un tipo de fruta en una fecha específica
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
           <div className="space-y-2">
             <Label htmlFor="fruitType">Tipo de Fruta</Label>
             <Select
               value={formData.fruitTypeId}
               onValueChange={(value) => handleInputChange("fruitTypeId", value)}
             >
               <SelectTrigger>
                 <SelectValue placeholder="Seleccionar tipo de fruta" />
               </SelectTrigger>
              <SelectContent>
                {fruitTypes.map((type, index) => (
                  <SelectItem key={`fruit-type-${type.id}-${index}`} value={type.id}>
                    {type.type} - {type.subtype}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

           <div className="space-y-2">
             <Label htmlFor="priceDate">Fecha</Label>
            <div className="relative">
              <Input
                id="priceDate"
                type="date"
                value={formData.priceDate}
                onChange={(e) => handleInputChange("priceDate", e.target.value)}
                className="pl-10"
              />
              <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

           <div className="space-y-2">
             <Label htmlFor="pricePerKg">Precio por Kilogramo (RD$)</Label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-muted-foreground">RD$</span>
              <Input
                id="pricePerKg"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.pricePerKg}
                onChange={(e) => handleInputChange("pricePerKg", e.target.value)}
                className="pl-12"
              />
            </div>
          </div>

           <Button
             type="submit"
             disabled={isSubmitting || !formData.fruitTypeId || !formData.pricePerKg}
             className="w-full"
           >
             <Save className="w-4 h-4 mr-2" />
             {isSubmitting ? "Estableciendo Precio..." : "Establecer Precio"}
           </Button>
        </form>
      </CardContent>
    </Card>
  );
}