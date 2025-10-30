"use client";

import { useUserPreferences, LayoutMode } from "@/hooks/use-user-preferences";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone, Tablet } from "lucide-react";

interface LayoutToggleProps {
  className?: string;
}

export function LayoutToggle({ className = "" }: LayoutToggleProps) {
  const { preferences, updateLayoutMode, getEffectiveLayoutMode } = useUserPreferences();
  const effectiveMode = getEffectiveLayoutMode();

  const handleModeChange = (mode: LayoutMode) => {
    updateLayoutMode(mode);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-muted-foreground">Vista:</span>

      <div className="flex gap-1 bg-muted p-1 rounded-lg">
        <Button
          type="button"
          variant={preferences.layoutMode === "desktop" ? "default" : "ghost"}
          size="sm"
          onClick={() => handleModeChange("desktop")}
          className="h-8 px-2"
          title="Vista de escritorio"
        >
          <Monitor className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Escritorio</span>
        </Button>

        <Button
          type="button"
          variant={preferences.layoutMode === "mobile" ? "default" : "ghost"}
          size="sm"
          onClick={() => handleModeChange("mobile")}
          className="h-8 px-2"
          title="Vista móvil"
        >
          <Smartphone className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Móvil</span>
        </Button>

        <Button
          type="button"
          variant={preferences.layoutMode === "auto" ? "default" : "ghost"}
          size="sm"
          onClick={() => handleModeChange("auto")}
          className="h-8 px-2"
          title="Detección automática"
        >
          <Tablet className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Auto</span>
        </Button>
      </div>

      {preferences.layoutMode !== "auto" && (
        <span className="text-xs text-muted-foreground">
          ({effectiveMode === "mobile" ? "Móvil" : "Escritorio"})
        </span>
      )}
    </div>
  );
}
