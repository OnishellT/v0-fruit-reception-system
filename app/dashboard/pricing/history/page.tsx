import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { FileSearch } from "lucide-react";
import { PricingHistoryClient } from "./pricing-history-client";

export default async function PricingHistoryPage() {
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
          <FileSearch className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">
            Historial de Precios
          </h1>
        </div>
        <p className="text-muted-foreground">
          Revise las recepciones anteriores con sus cálculos de precios basados en calidad.
          Verifique que los cambios en las reglas de precios no afecten los registros históricos.
        </p>
      </div>

      <PricingHistoryClient />
    </div>
  );
}
