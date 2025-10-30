"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface KeypadProps {
  type: "numeric" | "decimal";
  activeField: string | null;
  onKeyPress: (value: string) => void;
  className?: string;
}

export function Keypad({ type, activeField, onKeyPress, className = "" }: KeypadProps) {
  const isActive = !!activeField;

  const handleKeyPress = (value: string) => {
    if (!isActive) return;

    if (value === "clear") {
      onKeyPress("clear");
    } else if (value === "backspace") {
      onKeyPress("backspace");
    } else if (value === "decimal") {
      onKeyPress(".");
    } else {
      onKeyPress(value);
    }
  };

  // Don't render if no active field or not on mobile
  if (!activeField) return null;

  const keys = type === "decimal"
    ? [
        ["1", "2", "3"],
        ["4", "5", "6"],
        ["7", "8", "9"],
        [".", "0", "⌫"],
      ]
    : [
        ["1", "2", "3"],
        ["4", "5", "6"],
        ["7", "8", "9"],
        ["C", "0", "⌫"],
      ];

  return (
    <div className={`bg-background border-t border-border shadow-lg ${className}`}>
      {/* Keypad */}
      <div className="p-3">
        <div className="grid grid-cols-3 gap-2">
          {keys.flat().map((key, index) => {
            const isClearKey = key === "C";
            const isBackspaceKey = key === "⌫";
            const isDecimalKey = key === ".";
            const isSpecialKey = isClearKey || isBackspaceKey || isDecimalKey;

            return (
              <Button
                key={index}
                variant={isSpecialKey ? "destructive" : "default"}
                size="lg"
                className={`h-16 text-2xl font-semibold rounded-lg shadow-sm transition-all duration-150 active:scale-95 active:shadow-none ${isSpecialKey ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"}`}
                onClick={() => {
                  if (isClearKey) handleKeyPress("clear");
                  else if (isBackspaceKey) handleKeyPress("backspace");
                  else if (isDecimalKey) handleKeyPress("decimal");
                  else handleKeyPress(key);
                }}
              >
                {key === "clear" ? "C" : key}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
