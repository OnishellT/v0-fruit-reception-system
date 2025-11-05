"use client";

import type React from "react";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createReception, updateReception } from "@/lib/actions/reception";
import {
  getPricingRules,
  calculateReceptionPricing,
  getDailyPrice,
} from "@/lib/actions/pricing";
import { Trash2, Plus, DollarSign, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils/pricing";
import type { QualityEvaluationData } from "@/lib/types/pricing";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { useDailyReceptions } from "@/hooks/use-daily-receptions";
import { LayoutToggle } from "@/components/layout-toggle";
import { MobileDetailsList } from "@/components/mobile-details-list";
import { SummaryCards } from "@/components/summary-cards";
import { Keypad } from "@/components/ui/keypad";
import { ProviderSearch } from "@/components/provider-search";

interface Provider {
  id: string;
  code: string;
  name: string;
}

interface Driver {
  id: string;
  name: string;
}

interface FruitType {
  id: string;
  type: string;
  subtype: string;
}

interface ReceptionDetail {
  id?: string;
  fruit_type_id: string;
  quantity: number;
  weight_kg: number;
  line_number: number;
}

interface ExistingReception {
  id: string;
  provider_id: string | null;
  driver_id: string | null;
  fruit_type_id: string | null;
  truck_plate: string;
  total_containers: number;
  notes: string | null;
}

export function ReceptionForm({
  providers,
  drivers,
  fruitTypes,
  reception,
  details: existingDetails,
}: {
  providers: Provider[];
  drivers: Driver[];
  fruitTypes: FruitType[];
  reception?: ExistingReception;
  details?: ReceptionDetail[];
}) {
  // Determine if we're in edit mode
  const isEditMode = !!reception;
  const router = useRouter();
  const { getEffectiveLayoutMode, effectiveLayout, preferences } =
    useUserPreferences();
  const { addReception } = useDailyReceptions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dailyPrice, setDailyPrice] = useState<number | null>(null);

  // Keypad state
  const [activeField, setActiveField] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    provider_id: reception?.provider_id || "",
    driver_id: reception?.driver_id || "",
    fruit_type_id: reception?.fruit_type_id || "",
    truck_plate: reception?.truck_plate || "",
    total_containers: reception?.total_containers || 0,
    notes: reception?.notes || "",
  });

  // Quality evaluation state for weight discounts
  const [qualityData, setQualityData] = useState<QualityEvaluationData>({
    moho: 0,
    humedad: 0,
    violetas: 0,
  });

  const [details, setDetails] = useState<ReceptionDetail[]>(
    (existingDetails || []).map((d, index) => ({
      ...d,
      line_number: d.line_number || index + 1,
    })),
  );

  // Reload reception data from server after save
  const reloadReceptionData = async () => {
    if (!isEditMode || !reception) return;

    try {
      console.log("🔄 Reloading reception data after save...");
      const { getReceptionDetails } = await import("@/lib/actions/reception");
      const result = await getReceptionDetails(reception.id);

      if (result.reception) {
        console.log("✅ Reloaded reception data:", result.reception);
        loadExistingQualityData(result.reception);
      }
    } catch (error) {
      console.error("❌ Error reloading reception data:", error);
    }
  };

  // Load existing quality data for edit mode
  const loadExistingQualityData = async (reception: any) => {
    try {
      console.log(
        "🔄 Loading existing quality and discount data for reception:",
        reception.id,
      );

      // Quality evaluation data - check both possible locations
      const qe =
        reception.quality_evaluation ||
        (reception.quality_evaluations && reception.quality_evaluations[0]);

      if (qe) {
        const qualityData: QualityEvaluationData = {
          moho: qe.moho || 0,
          humedad: qe.humedad || 0,
          violetas: qe.violetas || 0,
        };

        console.log("✅ Loaded quality data from prop:", qualityData);
        setQualityData(qualityData);
      } else {
        console.log("⚠️ No existing quality data found");
        // Set default quality data
        setQualityData({
          moho: 0,
          humedad: 0,
          violetas: 0,
        });
      }
    } catch (error) {
      console.error("❌ Error loading existing quality data:", error);
      // Don't fail the form load, just log the error
    }
  };
  const [currentDetail, setCurrentDetail] = useState({
    fruit_type_id: "",
    quantity: 0,
    weight_kg: 0,
    line_number: 1,
  });

  // Initialize form data when reception changes (for edit mode)
  useEffect(() => {
    if (isEditMode && reception) {
      console.log(
        "🔄 Edit mode: Initializing form data for reception:",
        reception.id,
      );

      setFormData({
        provider_id: reception.provider_id || "",
        driver_id: reception.driver_id || "",
        fruit_type_id: reception.fruit_type_id || "",
        truck_plate: reception.truck_plate || "",
        total_containers: reception.total_containers || 0,
        notes: reception.notes || "",
      });

      // Load existing quality data
      loadExistingQualityData(reception);
    }
  }, [isEditMode, reception]);

  // Initialize details when existingDetails changes (for edit mode)
  useEffect(() => {
    if (isEditMode && existingDetails) {
      setDetails(existingDetails);
    }
  }, [isEditMode, existingDetails]);

  // Use useMemo to ensure layout mode is recalculated when preferences change
  const layoutMode = useMemo(() => {
    if (preferences.layoutMode === "auto") {
      if (typeof window !== "undefined") {
        return window.innerWidth < 768 ? "mobile" : "desktop";
      }
      return "desktop";
    }
    return preferences.layoutMode;
  }, [preferences.layoutMode]);

  const isMobile = layoutMode === "mobile";

  // Add bottom padding to account for keypad (only when active)
  const formPaddingClass = isMobile && activeField ? "pb-72" : "";

  // Reset active field when layout changes
  useEffect(() => {
    setActiveField(null);
  }, [isMobile]);

  // Update current detail fruit type when reception fruit type changes
  useEffect(() => {
    if (formData.fruit_type_id) {
      setCurrentDetail((prev) => ({
        ...prev,
        fruit_type_id: formData.fruit_type_id,
      }));
    }
  }, [formData.fruit_type_id]);

  // Fetch daily price when fruit type changes
  useEffect(() => {
    const fetchDailyPrice = async () => {
      if (formData.fruit_type_id) {
        try {
          const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
          const price = await getDailyPrice(formData.fruit_type_id, today);
          setDailyPrice(price ? price.pricePerKg : null);
        } catch (error) {
          console.error("Error fetching daily price:", error);
          setDailyPrice(null);
        }
      } else {
        setDailyPrice(null);
      }
    };

    fetchDailyPrice();
  }, [formData.fruit_type_id]);

  const addDetail = () => {
    if (currentDetail.quantity <= 0 || currentDetail.weight_kg <= 0) {
      setError("Complete cantidad y peso del detalle");
      return;
    }

    // Validate weight doesn't exceed database limit
    if (currentDetail.weight_kg > 99999999.99) {
      setError(`El peso no puede exceder 99,999,999.99 kg`);
      return;
    }

    const newDetail = {
      ...currentDetail,
      line_number: details.length + 1,
    };
    setDetails([...details, newDetail]);
    setCurrentDetail({
      fruit_type_id: formData.fruit_type_id,
      quantity: 0,
      weight_kg: 0,
      line_number: details.length + 2,
    });
    setError(null);
  };

  const removeDetail = (index: number) => {
    setDetails(details.filter((_, i) => i !== index));
  };

  const totalQuantity = details.reduce((sum, d) => sum + (d.quantity || 0), 0);
  const totalWeight = details.reduce(
    (sum, d) => sum + (Number(d.weight_kg) || 0),
    0,
  );
  const remainingContainers = formData.total_containers - totalQuantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate required fields
    if (!formData.provider_id || formData.provider_id === "") {
      setError("Debe seleccionar el proveedor");
      return;
    }

    if (!formData.driver_id || formData.driver_id === "") {
      setError("Debe seleccionar el chofer");
      return;
    }

    if (!formData.fruit_type_id || formData.fruit_type_id === "") {
      setError("Debe seleccionar el tipo de fruto");
      return;
    }

    if (!formData.truck_plate || formData.truck_plate === "") {
      setError("Debe ingresar la placa del camión");
      return;
    }

    if (formData.total_containers <= 0) {
      setError("Debe especificar el número de contenedores");
      return;
    }

    if (details.length === 0) {
      setError("Debe agregar al menos un detalle de pesada");
      return;
    }

    if (totalQuantity !== formData.total_containers) {
      setError(
        `La cantidad total (${totalQuantity}) no coincide con los contenedores esperados (${formData.total_containers})`,
      );
      return;
    }

    setLoading(true);

    let result;

    if (isEditMode && reception) {
      console.log("🔄 Updating reception...");
      result = await updateReception(reception.id, {
        ...formData,
        details,
        quality_data: qualityData,
        total_weight: totalWeight,
        discount_calculation: null,
      });
    } else {
      console.log("➕ Creating new reception...");
      result = await createReception({
        ...formData,
        details,
      });
    }

    console.log("📥 Reception result:", result);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // Track reception locally for dashboard totals (running daily total)
      if (!isEditMode) {
        // Use total weight
        const finalWeight = totalWeight;

        addReception({
          totalWeight: finalWeight,
          totalQuantity: totalQuantity,
          providerName: providers.find((p) => p.id === formData.provider_id)
            ?.name,
          truckPlate: formData.truck_plate,
        });
      }

      setSuccess(
        `Recepción ${
          isEditMode ? "actualizada" : "creada"
        } exitosamente: ${result.reception?.reception_number || "desconocida"}`,
      );

      // Refresh router to ensure data is up-to-date
      console.log("🔄 Refreshing page data after save...");
      router.refresh();

      // In edit mode, reload reception data to get updated quality values
      if (isEditMode) {
        setTimeout(async () => {
          console.log("🔄 Reloading quality data in edit mode...");
          await reloadReceptionData();
        }, 500);
      }

      setTimeout(
        () => {
          router.push("/dashboard/reception");
        },
        isEditMode ? 2000 : 1000,
      );
    }
  };

  const getFruitTypeLabel = (id: string) => {
    const fruit = fruitTypes.find((f) => f.id === id);
    return fruit ? `${fruit.type} - ${fruit.subtype}` : "";
  };

  const handleFieldClick = (fieldId: string, type: "numeric" | "decimal") => {
    setActiveField(fieldId);
  };

  const handleKeypadKeyPress = (value: string) => {
    if (!activeField) return;

    if (activeField === "total_containers") {
      if (value === "clear") {
        setFormData({ ...formData, total_containers: 0 });
      } else if (value === "backspace") {
        const newValue = Math.floor(formData.total_containers / 10);
        setFormData({ ...formData, total_containers: newValue });
      } else if (value !== "") {
        const current = formData.total_containers;
        const newValue = parseInt(`${current}${value}`);
        setFormData({
          ...formData,
          total_containers: isNaN(newValue) ? 0 : newValue,
        });
      }
    } else if (activeField === "quantity") {
      if (value === "clear") {
        setCurrentDetail({ ...currentDetail, quantity: 0 });
      } else if (value === "backspace") {
        const newValue = Math.floor(currentDetail.quantity / 10);
        setCurrentDetail({ ...currentDetail, quantity: newValue });
      } else if (value !== "") {
        const current = currentDetail.quantity;
        const newValue = parseInt(`${current}${value}`);
        setCurrentDetail({
          ...currentDetail,
          quantity: isNaN(newValue) ? 0 : newValue,
        });
      }
    } else if (activeField === "weight_kg") {
      if (value === "clear") {
        setCurrentDetail({ ...currentDetail, weight_kg: 0 });
      } else if (value === "backspace") {
        const strValue = currentDetail.weight_kg.toString();
        const newStrValue = strValue.slice(0, -1);
        const newValue = newStrValue ? parseFloat(newStrValue) : 0;
        setCurrentDetail({ ...currentDetail, weight_kg: newValue });
      } else if (value !== "") {
        const current = currentDetail.weight_kg.toString();
        const newStrValue = current + value;
        const newValue = parseFloat(newStrValue);
        setCurrentDetail({
          ...currentDetail,
          weight_kg: isNaN(newValue) ? 0 : newValue,
        });
      }
    } else if (activeField === "moho") {
      if (value === "clear") {
        setQualityData({ ...qualityData, moho: 0 });
      } else if (value === "backspace") {
        const newValue = Math.floor(qualityData.moho / 10);
        setQualityData({ ...qualityData, moho: newValue });
      } else if (value !== "") {
        const current = qualityData.moho;
        const newValue = parseInt(`${current}${value}`);
        setQualityData({
          ...qualityData,
          moho: Math.min(isNaN(newValue) ? 0 : newValue, 100), // Cap at 100
        });
      }
    } else if (activeField === "humedad") {
      if (value === "clear") {
        setQualityData({ ...qualityData, humedad: 0 });
      } else if (value === "backspace") {
        const newValue = Math.floor(qualityData.humedad / 10);
        setQualityData({ ...qualityData, humedad: newValue });
      } else if (value !== "") {
        const current = qualityData.humedad;
        const newValue = parseInt(`${current}${value}`);
        setQualityData({
          ...qualityData,
          humedad: Math.min(isNaN(newValue) ? 0 : newValue, 100), // Cap at 100
        });
      }
    } else if (activeField === "violetas") {
      if (value === "clear") {
        setQualityData({ ...qualityData, violetas: 0 });
      } else if (value === "backspace") {
        const newValue = Math.floor(qualityData.violetas / 10);
        setQualityData({ ...qualityData, violetas: newValue });
      } else if (value !== "") {
        const current = qualityData.violetas;
        const newValue = parseInt(`${current}${value}`);
        setQualityData({
          ...qualityData,
          violetas: Math.min(isNaN(newValue) ? 0 : newValue, 100), // Cap at 100
        });
      }
    }
  };

  // Determine keypad type based on active field
  const getKeypadType = (): "numeric" | "decimal" => {
    if (activeField === "weight_kg") return "decimal";
    return "numeric";
  };

  return (
    <div className={`space-y-6 ${formPaddingClass}`}>
      {/* Header with Layout Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {isEditMode ? "Editar Recepción" : "Nueva Recepción"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isEditMode
              ? "Modifique los datos de la recepción"
              : "Registre una nueva pesada de frutos"}
          </p>
        </div>
        <LayoutToggle className="flex-shrink-0" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Provider and Driver Info - Mobile: Stack vertically, Desktop: 2-column grid */}
        <div className={`grid gap-4 ${!isMobile ? "md:grid-cols-2" : ""}`}>
          <ProviderSearch
            providers={providers}
            value={formData.provider_id}
            onChange={(value) =>
              setFormData({ ...formData, provider_id: value })
            }
            disabled={loading}
            required
            placeholder="Seleccione proveedor"
          />

          <div className="space-y-2">
            <Label htmlFor="driver">Chofer *</Label>
            <Select
              value={formData.driver_id}
              onValueChange={(value) =>
                setFormData({ ...formData, driver_id: value })
              }
              disabled={loading}
              required
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Seleccione chofer" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fruit_type">Tipo de Fruto *</Label>
            <Select
              value={formData.fruit_type_id}
              onValueChange={(value) =>
                setFormData({ ...formData, fruit_type_id: value })
              }
              disabled={loading}
              required
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Seleccione tipo de fruto" />
              </SelectTrigger>
              <SelectContent>
                {fruitTypes.map((fruit) => (
                  <SelectItem key={fruit.id} value={fruit.id}>
                    {fruit.type} - {fruit.subtype}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="truck_plate">Placa del Camión *</Label>
            <Input
              id="truck_plate"
              type="text"
              value={formData.truck_plate}
              onChange={(e) =>
                setFormData({ ...formData, truck_plate: e.target.value })
              }
              required
              disabled={loading}
              className="h-11"
              placeholder="Ej: ABC-123"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_containers">Total Contenedores/Sacos *</Label>
            <Input
              id="total_containers"
              type="number"
              min="1"
              value={formData.total_containers || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  total_containers: Number.parseInt(e.target.value) || 0,
                })
              }
              onClick={() =>
                isMobile && handleFieldClick("total_containers", "numeric")
              }
              onFocus={() =>
                isMobile && handleFieldClick("total_containers", "numeric")
              }
              required
              disabled={loading}
              className={`h-11 ${isMobile ? (activeField === "total_containers" ? "ring-2 ring-primary" : "") : ""}`}
              placeholder="Ej: 25"
              readOnly={isMobile}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notas</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Observaciones adicionales..."
            disabled={loading}
            rows={isMobile ? 4 : 3}
            className={isMobile ? "min-h-[100px]" : ""}
          />
        </div>

        {/* Add Detail Section */}
        {formData.fruit_type_id && (
          <Card className={isMobile ? "p-4" : "p-6 bg-muted/50"}>
            <h3 className="font-semibold mb-4 text-lg">
              Agregar Pesada {getFruitTypeLabel(formData.fruit_type_id)}
            </h3>
            <div className={`grid gap-4 ${!isMobile ? "md:grid-cols-3" : ""}`}>
              <div className="space-y-2">
                <Label>Tipo de Fruto</Label>
                <Input
                  value={getFruitTypeLabel(formData.fruit_type_id)}
                  disabled
                  className="h-11 bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label>Cantidad *</Label>
                <Input
                  type="number"
                  min="1"
                  value={currentDetail.quantity || ""}
                  onChange={(e) =>
                    setCurrentDetail({
                      ...currentDetail,
                      quantity: Number.parseInt(e.target.value) || 0,
                    })
                  }
                  onClick={() =>
                    isMobile && handleFieldClick("quantity", "numeric")
                  }
                  onFocus={() =>
                    isMobile && handleFieldClick("quantity", "numeric")
                  }
                  placeholder="Ej: 10"
                  disabled={loading}
                  className={`h-11 ${isMobile ? (activeField === "quantity" ? "ring-2 ring-primary" : "") : ""}`}
                  readOnly={isMobile}
                />
              </div>

              <div className="space-y-2">
                <Label>Peso (kg) *</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={currentDetail.weight_kg || ""}
                  onChange={(e) =>
                    setCurrentDetail({
                      ...currentDetail,
                      weight_kg: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                  onClick={() =>
                    isMobile && handleFieldClick("weight_kg", "decimal")
                  }
                  onFocus={() =>
                    isMobile && handleFieldClick("weight_kg", "decimal")
                  }
                  placeholder="Ej: 5.50"
                  disabled={loading}
                  className={`h-11 ${isMobile ? (activeField === "weight_kg" ? "ring-2 ring-primary" : "") : ""}`}
                  readOnly={isMobile}
                />
              </div>
            </div>

            <div className={isMobile ? "mt-4" : "mt-6 flex justify-end"}>
              <Button
                type="button"
                onClick={addDetail}
                disabled={loading}
                className="gap-2 h-11 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                Agregar Detalle
              </Button>
            </div>
          </Card>
        )}

        {/* Details Table (Desktop) or Mobile Cards (Mobile) */}
        {details.length > 0 && (
          <div className="space-y-4">
            {isMobile ? (
              <MobileDetailsList
                details={details}
                getFruitTypeLabel={getFruitTypeLabel}
                onRemoveDetail={removeDetail}
                disabled={loading}
              />
            ) : (
              <div className="space-y-2">
                <h3 className="font-semibold">Detalles de Pesada</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Tipo de Fruto</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Peso (kg)</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {details.map((detail, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            {getFruitTypeLabel(detail.fruit_type_id)}
                          </TableCell>
                          <TableCell className="text-right">
                            {detail.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {detail.weight_kg.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDetail(index)}
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={2}>TOTALES</TableCell>
                        <TableCell className="text-right">
                          {totalQuantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {totalWeight.toFixed(2)}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Summary Cards */}
            <SummaryCards
              totalContainers={formData.total_containers}
              totalQuantity={totalQuantity}
              remainingContainers={remainingContainers}
              layoutMode={layoutMode}
            />

            {/* Quality Evaluation Section - Only for CAFÉ */}

            {/* Enhanced Pricing Preview */}
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 text-green-900 border-green-200">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className={`flex gap-4 ${isMobile ? "flex-col" : ""}`}>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
            className={isMobile ? "w-full h-12 text-base" : "flex-1"}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className={isMobile ? "w-full h-12 text-base" : "flex-1"}
          >
            {loading ? "Guardando..." : "Guardar Recepción"}
          </Button>
        </div>
      </form>

      {/* Keypad Component - Persistent bottom bar in mobile mode */}
      {isMobile && activeField && (
        <Keypad
          type={getKeypadType()}
          activeField={activeField}
          onKeyPress={handleKeypadKeyPress}
          className="fixed bottom-0 left-0 right-0 z-40"
        />
      )}
    </div>
  );
}
