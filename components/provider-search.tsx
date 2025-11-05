"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SearchInput } from "@/components/ui/search-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Provider {
  id: string;
  code: string;
  name: string;
}

interface ProviderSearchProps {
  providers: Provider[];
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
}

export function ProviderSearch({
  providers,
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder = "Seleccionar proveedor",
}: ProviderSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter providers based on search term (search in both name and code)
  const filteredProviders = providers.filter((provider) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      provider.name.toLowerCase().includes(searchLower) ||
      provider.code.toLowerCase().includes(searchLower)
    );
  });

  // Get selected provider for display
  const selectedProvider = providers.find((provider) => provider.id === value);

  const handleSelect = (providerId: string) => {
    onChange(providerId);
    setOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="space-y-2">
      <Label>Proveedor {required && "*"}</Label>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start h-11 text-left font-normal"
            disabled={disabled}
          >
            {selectedProvider ? (
              <span className="truncate">
                {selectedProvider.code} - {selectedProvider.name}
              </span>
            ) : (
              <span className="text-muted-foreground">
                {placeholder}
              </span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Seleccionar Proveedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar por nombre o código..."
            />
            <div className="max-h-64 overflow-y-auto">
              <div className="space-y-1">
                {filteredProviders.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    {searchTerm ? "No se encontraron proveedores." : "No hay proveedores disponibles."}
                  </div>
                ) : (
                  filteredProviders.map((provider) => (
                    <Button
                      key={provider.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start h-auto p-3",
                        value === provider.id && "bg-accent"
                      )}
                      onClick={() => handleSelect(provider.id)}
                    >
                      <div className="flex items-center w-full">
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === provider.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col items-start flex-1 min-w-0">
                          <span className="font-medium truncate w-full">
                            {provider.code}
                          </span>
                          <span className="text-sm text-muted-foreground truncate w-full">
                            {provider.name}
                          </span>
                        </div>
                      </div>
                    </Button>
                  ))
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}