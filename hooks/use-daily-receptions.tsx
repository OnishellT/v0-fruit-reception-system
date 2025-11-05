"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { getReceptions } from "@/lib/actions/reception";

interface DailyReception {
  id: string;
  timestamp: string;
  totalWeight: number;
  totalQuantity: number;
  providerName?: string;
  truckPlate?: string;
}

const STORAGE_KEY = "daily-receptions";

// Create context
const DailyReceptionsContext = createContext<{
  receptions: DailyReception[];
  totals: {
    count: number;
    totalWeight: number;
    totalQuantity: number;
  };
  addReception: (reception: Omit<DailyReception, "id" | "timestamp">) => DailyReception;
  removeReception: (id: string) => void;
  clearTodaysReceptions: () => void;
} | null>(null);

// Provider component
export function DailyReceptionsProvider({ children }: { children: ReactNode }) {
  const [receptions, setReceptions] = useState<DailyReception[]>([]);
  const isUpdatingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get today's date in YYYY-MM-DD format
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Load receptions from Supabase first, then localStorage as fallback
  useEffect(() => {
    const loadReceptions = async () => {
      try {
        console.log("🔄 Loading daily receptions from Supabase...");
        const result = await getReceptions();

        if (result.receptions && result.receptions.length > 0) {
          console.log(`✅ Loaded ${result.receptions.length} receptions from Supabase`);

          // Calculate totals from reception details for each reception
          const dailyReceptions: DailyReception[] = result.receptions.map(r => ({
            id: r.id,
            timestamp: r.created_at,
            totalWeight: r.total_weight || 0, // Use pre-calculated total or 0
            totalQuantity: r.total_containers || 0,
            providerName: r.provider?.name || r.provider_id,
            truckPlate: r.truck_plate,
          }));

          setReceptions(dailyReceptions);
          return;
        }

        console.log("ℹ️ No receptions found in Supabase, trying localStorage...");
        // Fallback to localStorage if Supabase returns no data
        const stored = localStorage.getItem(STORAGE_KEY);
        console.log("📦 Stored data:", stored);

        if (stored) {
          const allReceptions = JSON.parse(stored);
          const today = getTodayString();

          // Only load today's receptions
          const todayReceptions = allReceptions.filter(
            (r: DailyReception) => r.timestamp && r.timestamp.startsWith(today)
          );

          console.log(`✅ Loaded ${todayReceptions.length} receptions from localStorage for today (${today})`);
          setReceptions(todayReceptions);
        } else {
          console.log("ℹ️ No stored data found, starting with empty array");
          setReceptions([]);
        }
      } catch (error) {
        console.error("❌ Error loading daily receptions from Supabase, trying localStorage...", error);
        // Fallback to localStorage on error
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const allReceptions = JSON.parse(stored);
            const today = getTodayString();
            const todayReceptions = allReceptions.filter(
              (r: DailyReception) => r.timestamp && r.timestamp.startsWith(today)
            );
            console.log(`✅ Loaded ${todayReceptions.length} receptions from localStorage fallback`);
            setReceptions(todayReceptions);
          } else {
            setReceptions([]);
          }
        } catch (fallbackError) {
          console.error("❌ Error loading from localStorage:", fallbackError);
          setReceptions([]);
        }
      }
    };

    loadReceptions();
  }, []);

  // Save receptions to localStorage whenever receptions change
  useEffect(() => {
    if (isUpdatingRef.current) return;

    const timeoutId = setTimeout(() => {
      isUpdatingRef.current = false;
    }, 100);

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allReceptions = stored ? JSON.parse(stored) : [];

      // Remove today's receptions from stored data
      const today = getTodayString();
      const otherDaysReceptions = allReceptions.filter(
        (r: DailyReception) => !r.timestamp || !r.timestamp.startsWith(today)
      );

      // Combine with today's receptions
      const updated = [...otherDaysReceptions, ...receptions];

      console.log(`💾 Saving ${receptions.length} receptions to localStorage...`);
      isUpdatingRef.current = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      console.log("✅ Saved successfully");
    } catch (error) {
      console.error("❌ Error saving daily receptions:", error);
      isUpdatingRef.current = false;
      clearTimeout(timeoutId);
    }

    // Cleanup timeout on unmount or when effect runs again
    return () => {
      clearTimeout(timeoutId);
    };
  }, [receptions]);

  // Listen for storage changes (in case localStorage is updated in another tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Ignore updates we're making ourselves
      if (isUpdatingRef.current) return;

      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const allReceptions = JSON.parse(e.newValue);
          const today = getTodayString();
          const todayReceptions = allReceptions.filter(
            (r: DailyReception) => r.timestamp && r.timestamp.startsWith(today)
          );
          setReceptions(todayReceptions);
        } catch (error) {
          console.error("Error parsing stored receptions:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Add a new reception
  const addReception = (reception: Omit<DailyReception, "id" | "timestamp">) => {
    const newReception: DailyReception = {
      ...reception,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    console.log("➕ Adding new reception:", newReception);
    setReceptions((prev) => [...prev, newReception]);
    return newReception;
  };

  // Remove a reception by ID
  const removeReception = (id: string) => {
    console.log("🗑️ Removing reception:", id);
    setReceptions((prev) => prev.filter((r) => r.id !== id));
  };

  // Clear all today's receptions
  const clearTodaysReceptions = () => {
    console.log("🧹 Clearing all today's receptions");
    setReceptions([]);
  };

  // Calculate totals
  const totals = {
    count: receptions.length,
    totalWeight: receptions.reduce((sum, r) => sum + r.totalWeight, 0),
    totalQuantity: receptions.reduce((sum, r) => sum + r.totalQuantity, 0),
  };

  return (
    <DailyReceptionsContext.Provider
      value={{
        receptions,
        totals,
        addReception,
        removeReception,
        clearTodaysReceptions,
      }}
    >
      {children}
    </DailyReceptionsContext.Provider>
  );
}

// Hook to use the context
export function useDailyReceptions() {
  const context = useContext(DailyReceptionsContext);
  if (!context) {
    throw new Error("useDailyReceptions must be used within DailyReceptionsProvider");
  }
  return context;
}
