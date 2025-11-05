"use client";

import { useUserPreferences } from "@/hooks/use-user-preferences";
import { DailyReceptionsProvider } from "@/hooks/use-daily-receptions";
import { ReceptionForm } from "@/components/reception-form";

export function ReceptionFormWrapper({
  providers,
  drivers,
  fruitTypes,
}: {
  providers: any[];
  drivers: any[];
  fruitTypes: any[];
}) {
  const { effectiveLayout } = useUserPreferences();
  // Force re-render when layout changes by using layout as key
  return (
    <DailyReceptionsProvider>
      <ReceptionForm
        key={`${effectiveLayout}-new`}
        providers={providers}
        drivers={drivers}
        fruitTypes={fruitTypes}
      />
    </DailyReceptionsProvider>
  );
}
