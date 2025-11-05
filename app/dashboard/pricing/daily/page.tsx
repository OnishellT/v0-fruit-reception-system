import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { DollarSign } from "lucide-react";
import { DailyPricingClient } from "@/components/daily-pricing-client";

export default async function DailyPricingPage() {
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
            Precios Diarios
          </h1>
        </div>
        <p className="text-muted-foreground">
          Configure precios diarios para recepciones regulares. Estos precios se aplicarán automáticamente
          en los cálculos de recepción junto con descuentos por calidad.
        </p>
      </div>

      <DailyPricingClient />
    </div>
  );
}