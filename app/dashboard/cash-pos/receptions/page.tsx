import { ReceptionList } from "@/components/cash-pos/reception-list";

export default function ReceptionsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Recepciones de Efectivo</h1>
        <p className="text-muted-foreground mt-2">
          Ver y gestionar todas las recepciones de fruta en efectivo
        </p>
      </div>

      <ReceptionList />
    </div>
  );
}