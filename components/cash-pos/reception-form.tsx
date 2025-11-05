"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calculator, Save, Loader2, AlertCircle } from "lucide-react";
import { createCashReception, updateCashReception, calculateCashDiscounts } from "@/lib/actions/cash/receptions";
import { getCashFruitTypes } from "@/lib/actions/cash/fruit-types";
import { getCashCustomers } from "@/lib/actions/cash/customers";
import { getPriceForReception } from "@/lib/actions/cash/prices";
import { toast } from "sonner";

interface FruitType {
  id: number;
  code: string;
  name: string;
}

interface Customer {
  id: number;
  name: string;
  nationalId: string;
}

interface ReceptionFormProps {
  initialData?: {
    id?: number;
    fruitTypeId: number;
    customerId: number;
    receptionDate: string;
    containersCount: number;
    totalWeightKgOriginal: number;
    calidadHumedad?: number;
    calidadMoho?: number;
    calidadVioletas?: number;
  };
  isEditing?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReceptionForm({ initialData, isEditing = false, onSuccess, onCancel }: ReceptionFormProps) {
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [fruitTypes, setFruitTypes] = useState<FruitType[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [priceInfo, setPriceInfo] = useState<{ price_per_kg?: number; has_price: boolean } | null>(null);

  const [formData, setFormData] = useState({
    fruit_type_id: initialData?.fruitTypeId?.toString() || "",
    customer_id: initialData?.customerId?.toString() || "",
    reception_date: initialData?.receptionDate || new Date().toISOString().split('T')[0],
    containers_count: initialData?.containersCount?.toString() || "",
    total_weight_kg_original: initialData?.totalWeightKgOriginal?.toString() || "",
    calidad_humedad: initialData?.calidadHumedad?.toString() || "",
    calidad_moho: initialData?.calidadMoho?.toString() || "",
    calidad_violetas: initialData?.calidadVioletas?.toString() || "",
  });

  const [calculatedAmounts, setCalculatedAmounts] = useState<{
    gross_amount: number;
    net_amount: number;
    discount_amount: number;
    final_weight: number;
  } | null>(null);

  // Load fruit types and customers on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Check price availability when fruit type or date changes
  useEffect(() => {
    if (formData.fruit_type_id && formData.reception_date) {
      checkPriceAvailability();
    }
  }, [formData.fruit_type_id, formData.reception_date]);

  const loadData = async () => {
    try {
      const [fruitTypesResult, customersResult] = await Promise.all([
        getCashFruitTypes({ enabled_only: true }),
        getCashCustomers(),
      ]);

      if (fruitTypesResult.success && fruitTypesResult.data) {
        setFruitTypes(fruitTypesResult.data);
      }

      if (customersResult.success && customersResult.data) {
        setCustomers(customersResult.data);
      }
    } catch (error) {
      console.error("Error cargando datos del formulario:", error);
      toast.error("Error al cargar datos del formulario");
    }
  };

  const checkPriceAvailability = async () => {
    if (!formData.fruit_type_id || !formData.reception_date) return;

    try {
      const result = await getPriceForReception({
        fruit_type_id: parseInt(formData.fruit_type_id),
        reception_date: formData.reception_date,
      });

      if (result.success && result.data) {
        setPriceInfo({ price_per_kg: result.data.price_per_kg, has_price: true });
      } else {
        setPriceInfo({ has_price: false });
      }
    } catch (error) {
      console.error("Error verificando precio:", error);
      setPriceInfo({ has_price: false });
    }
  };

  const calculateAmounts = async () => {
    if (!formData.total_weight_kg_original || !formData.fruit_type_id || !priceInfo?.price_per_kg) return;

    setCalculating(true);
    try {
      const weight = parseFloat(formData.total_weight_kg_original);
      const price = priceInfo.price_per_kg;

      // Prepare quality data for discount calculation
      const qualityData = {
        humedad: formData.calidad_humedad ? parseFloat(formData.calidad_humedad) : 0,
        moho: formData.calidad_moho ? parseFloat(formData.calidad_moho) : 0,
        violetas: formData.calidad_violetas ? parseFloat(formData.calidad_violetas) : 0,
      };

      // Calculate discounts based on quality metrics
      const discountResult = await calculateCashDiscounts({
        fruit_type_id: parseInt(formData.fruit_type_id),
        total_weight: weight,
        quality_data: qualityData,
      });

      if (discountResult.success && discountResult.data) {
        const discountData = discountResult.data;
        const grossAmount = weight * price;
        const netAmount = discountData.total_peso_final * price;
        const discountAmount = grossAmount - netAmount;
        const finalWeight = discountData.total_peso_final;

        setCalculatedAmounts({
          gross_amount: grossAmount,
          net_amount: netAmount,
          discount_amount: discountAmount,
          final_weight: finalWeight,
        });
      } else {
        // Fallback to simple calculation if discount calculation fails
        const grossAmount = weight * price;
        const netAmount = grossAmount;
        const discountAmount = 0;
        const finalWeight = weight;

        setCalculatedAmounts({
          gross_amount: grossAmount,
          net_amount: netAmount,
          discount_amount: discountAmount,
          final_weight: finalWeight,
        });
        toast.error("Error calculando descuentos: " + (discountResult.error || "Error desconocido"));
      }
    } catch (error) {
      console.error("Error calculando montos:", error);
       toast.error("Error calculando montos");
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fruit_type_id || !formData.customer_id || !formData.reception_date ||
        !formData.containers_count || !formData.total_weight_kg_original) {
      toast.error("Por favor complete todos los campos requeridos");
      return;
    }

    if (!priceInfo?.has_price) {
      toast.error("No hay precio disponible para la fecha y tipo de fruta seleccionados");
      return;
    }

    try {
      setLoading(true);
      const receptionData = {
        fruit_type_id: parseInt(formData.fruit_type_id),
        customer_id: parseInt(formData.customer_id),
        reception_date: formData.reception_date,
        containers_count: parseInt(formData.containers_count),
        total_weight_kg_original: parseFloat(formData.total_weight_kg_original),
        calidad_humedad: formData.calidad_humedad ? parseFloat(formData.calidad_humedad) : undefined,
        calidad_moho: formData.calidad_moho ? parseFloat(formData.calidad_moho) : undefined,
        calidad_violetas: formData.calidad_violetas ? parseFloat(formData.calidad_violetas) : undefined,
      };

      let result;
      if (isEditing && initialData?.id) {
        result = await updateCashReception({
          id: initialData.id,
          ...receptionData,
        });
      } else {
        result = await createCashReception(receptionData);
      }

      if (result.success) {
        toast.success(`Recepción ${isEditing ? 'actualizada' : 'creada'} exitosamente`);
        onSuccess?.();
      } else {
        toast.error(result.error || `Error al ${isEditing ? 'actualizar' : 'crear'} la recepción`);
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'actualizando' : 'creando'} recepción:`, error);
      toast.error(`Error inesperado al ${isEditing ? 'actualizar' : 'crear'} la recepción`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {isEditing ? 'Editar Recepción' : 'Nueva Recepción'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {isEditing
            ? 'Modificar los detalles de la recepción de fruta'
            : 'Crear una nueva recepción de fruta con cálculo automático de precios y descuentos'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>
              Detalles principales de la recepción
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fruit_type">Tipo de Fruta *</Label>
                <Select
                  value={formData.fruit_type_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, fruit_type_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo de fruta" />
                  </SelectTrigger>
                  <SelectContent>
                    {fruitTypes.map((type, index) => (
                      <SelectItem key={`fruit-type-${type.id}-${index}`} value={type.id.toString()}>
                        {type.name} ({type.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer">Cliente *</Label>
                <Select
                  value={formData.customer_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name} - {customer.nationalId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reception_date">Fecha de Recepción *</Label>
                <Input
                  id="reception_date"
                  type="date"
                  value={formData.reception_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, reception_date: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="containers_count">Número de Contenedores *</Label>
                <Input
                  id="containers_count"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.containers_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, containers_count: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Price Information */}
            {formData.fruit_type_id && formData.reception_date && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  {priceInfo?.has_price ? (
                    <>
                      <Badge variant="default">Precio Disponible</Badge>
                      <span className="text-sm">
                        RD$ {priceInfo.price_per_kg?.toFixed(2)} por kg
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      <Badge variant="destructive">Sin Precio</Badge>
                      <span className="text-sm text-muted-foreground">
                        Configure un precio para esta fecha y tipo de fruta
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weight and Quality */}
        <Card>
          <CardHeader>
            <CardTitle>Peso y Calidad</CardTitle>
            <CardDescription>
              Información de peso y métricas de calidad para cálculo de descuentos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="total_weight">Peso Total Original (kg) *</Label>
              <Input
                id="total_weight"
                type="number"
                min="0"
                step="0.001"
                placeholder="0.000"
                value={formData.total_weight_kg_original}
                onChange={(e) => setFormData(prev => ({ ...prev, total_weight_kg_original: e.target.value }))}
                required
              />
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="humedad">Humedad (%)</Label>
                <Input
                  id="humedad"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.calidad_humedad}
                  onChange={(e) => setFormData(prev => ({ ...prev, calidad_humedad: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="moho">Moho (%)</Label>
                <Input
                  id="moho"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.calidad_moho}
                  onChange={(e) => setFormData(prev => ({ ...prev, calidad_moho: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="violetas">Violetas (%)</Label>
                <Input
                  id="violetas"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.calidad_violetas}
                  onChange={(e) => setFormData(prev => ({ ...prev, calidad_violetas: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calculation Preview */}
        {calculatedAmounts && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="w-4 h-4 mr-2" />
                Cálculo de Montos
              </CardTitle>
              <CardDescription>
                Vista previa de los cálculos de precio y descuentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Monto Bruto</p>
                  <p className="text-lg font-semibold">RD$ {calculatedAmounts.gross_amount.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Descuento</p>
                  <p className="text-lg font-semibold text-destructive">-RD$ {calculatedAmounts.discount_amount.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Monto Neto</p>
                  <p className="text-lg font-semibold text-green-600">RD$ {calculatedAmounts.net_amount.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Peso Final</p>
                  <p className="text-lg font-semibold">{calculatedAmounts.final_weight.toFixed(3)} kg</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel || (() => window.history.back())}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={calculateAmounts}
            disabled={calculating || !priceInfo?.has_price}
          >
            {calculating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Calculando...
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4 mr-2" />
                Calcular
              </>
            )}
          </Button>
          <Button type="submit" disabled={loading || !priceInfo?.has_price}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditing ? 'Actualizando...' : 'Creando...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? 'Actualizar' : 'Crear'} Recepción
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}