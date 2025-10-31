"use client";

import { DailyReceptionsProvider } from "@/hooks/use-daily-receptions";

export function DashboardProviderWrapper({ children }: { children: React.ReactNode }) {
  return <DailyReceptionsProvider>{children}</DailyReceptionsProvider>;
}
