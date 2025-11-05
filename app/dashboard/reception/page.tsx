import { getReceptions } from "@/lib/actions/reception";
import { getSession } from "@/lib/actions/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import ReceptionsTableClient from "./receptions-table-client";

export default async function ReceptionPage() {
  const result = await getReceptions();
  const session = await getSession();
  
  if (!session) {
    return <div>Error: Not authenticated</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Recepción de Frutos
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestione las recepciones y pesadas de frutos
          </p>
        </div>
        <Link href="/dashboard/reception/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Recepción
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recepciones Recientes</CardTitle>
          <CardDescription>Últimas 50 recepciones registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {result.error ? (
            <p className="text-red-600">{result.error}</p>
          ) : (
            <ReceptionsTableClient 
              receptions={result.receptions || []} 
              userRole={session.role as "admin" | "operator"}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
