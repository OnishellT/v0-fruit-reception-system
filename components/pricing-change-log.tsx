"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, TrendingUp, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface PricingChange {
  id: string;
  fruit_type: string;
  action: "create" | "update" | "delete";
  changes: Array<{
    field: string;
    old_value: any;
    new_value: any;
  }>;
  user?: {
    username: string;
  };
  created_at: string;
}

interface PricingChangeLogProps {
  changes: PricingChange[];
  onRestore?: (changeId: string) => void;
}

export function PricingChangeLog({ changes, onRestore }: PricingChangeLogProps) {
  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "bg-green-100 text-green-800";
      case "update":
        return "bg-blue-100 text-blue-800";
      case "delete":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "create":
        return "Creado";
      case "update":
        return "Actualizado";
      case "delete":
        return "Eliminado";
      default:
        return action;
    }
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      quality_based_pricing_enabled: "Precios basados en calidad",
      min_value: "Valor mínimo",
      max_value: "Valor máximo",
      discount_percentage: "Porcentaje de descuento",
      quality_metric: "Métrica de calidad"
    };
    return labels[field] || field;
  };

  if (changes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay cambios registrados aún</p>
            <p className="text-sm mt-1">Los cambios aparecerán aquí conforme configure los precios</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historial de Cambios
        </CardTitle>
        <CardDescription>
          Registro de modificaciones en las reglas de precios
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {changes.map((change) => (
            <div
              key={change.id}
              className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Badge className={getActionColor(change.action)}>
                    {getActionLabel(change.action)}
                  </Badge>
                  <span className="font-medium">{change.fruit_type}</span>
                  <span className="text-sm text-muted-foreground">
                    por {change.user?.username || "Sistema"}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(change.created_at), {
                    addSuffix: true,
                    locale: es
                  })}
                </span>
              </div>

              <div className="space-y-2">
                {change.changes.map((changeDetail, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium text-muted-foreground">
                      {getFieldLabel(changeDetail.field)}:
                    </span>
                    {change.action === "delete" ? (
                      <span className="ml-2 text-red-600">
                        {String(changeDetail.old_value)}
                      </span>
                    ) : change.action === "create" ? (
                      <span className="ml-2 text-green-600">
                        {String(changeDetail.new_value)}
                      </span>
                    ) : (
                      <div className="ml-2 flex items-center gap-2">
                        <span className="text-red-600 line-through">
                          {String(changeDetail.old_value)}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-green-600">
                          {String(changeDetail.new_value)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {onRestore && change.action === "update" && (
                <div className="mt-3 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRestore(change.id)}
                    className="text-xs"
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Restaurar esta versión
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
