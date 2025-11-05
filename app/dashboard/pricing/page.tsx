import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { DollarSign, TrendingDown } from "lucide-react";
import { PricingRulesClient } from "./pricing-rules-client";

export default async function PricingPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">
            Configuración de Precios por Calidad
          </h1>
        </div>
        <p className="text-muted-foreground">
          Configure umbrales de descuento basados en métricas de calidad para cada tipo de fruto.
          Los descuentos se aplican automáticamente durante el proceso de recepción.
        </p>
      </div>

      <PricingRulesClient />
    </div>
  );
}
