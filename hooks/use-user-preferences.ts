"use client";

import { useState, useEffect } from "react";

export type LayoutMode = "desktop" | "mobile" | "auto";

interface UserPreferences {
  layoutMode: LayoutMode;
}

const STORAGE_KEY = "user-preferences";

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    layoutMode: "auto",
  });

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences(parsed);
      }
    } catch (error) {
      console.error("Error loading user preferences:", error);
    }
  }, []);

  // Listen for storage changes (in case localStorage is updated in another tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setPreferences(parsed);
        } catch (error) {
          console.error("Error parsing stored preferences:", error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Save preferences to localStorage
  const updateLayoutMode = (mode: LayoutMode) => {
    const newPreferences = { ...preferences, layoutMode: mode };
    setPreferences(newPreferences);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
    } catch (error) {
      console.error("Error saving user preferences:", error);
    }
  };

  // Get the effective layout mode (resolves "auto" based on screen size)
  const getEffectiveLayoutMode = (): "desktop" | "mobile" => {
    if (preferences.layoutMode === "auto") {
      // Check if screen is mobile/tablet
      if (typeof window !== "undefined") {
        return window.innerWidth < 768 ? "mobile" : "desktop";
      }
      return "desktop"; // Default for SSR
    }
    return preferences.layoutMode as "desktop" | "mobile";
  };

  // Return preferences explicitly to ensure component re-renders
  const effectiveLayout = getEffectiveLayoutMode();

  return {
    preferences,
    updateLayoutMode,
    getEffectiveLayoutMode,
    effectiveLayout,
  };
}
