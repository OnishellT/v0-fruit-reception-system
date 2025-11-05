"use client";

import { LayoutMode } from "@/hooks/use-user-preferences";

interface SummaryCardsProps {
  totalContainers: number;
  totalQuantity: number;
  remainingContainers: number;
  layoutMode: "desktop" | "mobile";
}

export function SummaryCards({
  totalContainers,
  totalQuantity,
  remainingContainers,
  layoutMode,
}: SummaryCardsProps) {
  // Desktop: horizontal layout with 3 cards
  if (layoutMode === "desktop") {
    return (
      <div className="flex gap-4 text-sm">
        <div className="flex-1 p-3 bg-accent/50 rounded-lg">
          <p className="text-muted-foreground">Contenedores Esperados</p>
          <p className="text-2xl font-bold text-primary">
            {totalContainers}
          </p>
        </div>
        <div className="flex-1 p-3 bg-accent/50 rounded-lg">
          <p className="text-muted-foreground">Contenedores Registrados</p>
          <p className="text-2xl font-bold text-primary">
            {totalQuantity}
          </p>
        </div>
        <div className="flex-1 p-3 bg-accent/50 rounded-lg">
          <p className="text-muted-foreground">Contenedores Restantes</p>
          <p
            className={`text-2xl font-bold ${
              remainingContainers === 0 ? "text-green-600" : "text-primary"
            }`}
          >
            {remainingContainers}
          </p>
        </div>
      </div>
    );
  }

  // Mobile: vertical layout with better spacing
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
        Resumen
      </h4>
      <div className="grid gap-3">
        <div className="p-4 bg-accent/50 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Contenedores Esperados
          </p>
          <p className="text-3xl font-bold text-primary mt-1">
            {totalContainers}
          </p>
        </div>

        <div className="p-4 bg-accent/50 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Contenedores Registrados
          </p>
          <p className="text-3xl font-bold text-primary mt-1">
            {totalQuantity}
          </p>
        </div>

        <div className="p-4 bg-accent/50 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Contenedores Restantes
          </p>
          <p
            className={`text-3xl font-bold mt-1 ${
              remainingContainers === 0 ? "text-green-600" : "text-primary"
            }`}
          >
            {remainingContainers}
          </p>
        </div>
      </div>
    </div>
  );
}
