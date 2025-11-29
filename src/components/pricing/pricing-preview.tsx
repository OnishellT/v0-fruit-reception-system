import { component$, useSignal, useTask$ } from '@builder.io/qwik';
import { server$ } from '@builder.io/qwik-city';
import { calculateReceptionPricingUtil } from '~/lib/actions/pricing/calculations';
import type { CalculateReceptionPricingData } from '~/lib/actions/types';

// Server-side calculation function
export const previewPricing = server$(async (data: CalculateReceptionPricingData) => {
    return await calculateReceptionPricingUtil(data);
});

interface Props {
    fruitType: string;
    totalWeight: number;
    qualityMetrics: { metric: string; value: number }[];
    basePricePerKg: number;
}

export const PricingPreview = component$<Props>(({
    fruitType,
    totalWeight,
    qualityMetrics,
    basePricePerKg
}) => {
    const calculationResult = useSignal<any>(null);
    const loading = useSignal(false);
    const error = useSignal<string | null>(null);

    // Debounce calculation
    useTask$(({ track, cleanup }) => {
        track(() => fruitType);
        track(() => totalWeight);
        track(() => qualityMetrics); // This might need deep tracking or key
        track(() => basePricePerKg);

        const timeout = setTimeout(async () => {
            if (!fruitType || totalWeight <= 0 || basePricePerKg <= 0) {
                calculationResult.value = null;
                return;
            }

            loading.value = true;
            error.value = null;

            try {
                // Cast fruitType to the expected union type as we know it comes from valid sources
                const result = await previewPricing({
                    fruit_type: fruitType as any,
                    total_weight: totalWeight,
                    quality_evaluation: qualityMetrics as any,
                    base_price_per_kg: basePricePerKg
                });

                if (result.can_calculate && result.data) {
                    calculationResult.value = result.data;
                } else {
                    error.value = result.errors ? result.errors.join(', ') : 'Error al calcular';
                    calculationResult.value = null;
                }
            } catch (err) {
                console.error(err);
                error.value = 'Error de conexión';
            } finally {
                loading.value = false;
            }
        }, 500); // 500ms debounce

        cleanup(() => clearTimeout(timeout));
    });

    if (!calculationResult.value && !loading.value && !error.value) {
        return null;
    }

    return (
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="space-y-4">
                <h3 class="text-lg font-bold text-gray-900 border-b pb-2">
                    Vista Previa de Liquidación
                </h3>

                {loading.value ? (
                    <div class="flex justify-center py-4">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : error.value ? (
                    <div class="text-red-600 text-sm bg-red-50 p-3 rounded">
                        {error.value}
                    </div>
                ) : calculationResult.value ? (
                    <div class="space-y-3">
                        <div class="flex justify-between items-center text-sm">
                            <span class="text-gray-600">Peso Original:</span>
                            <span class="font-medium">{totalWeight.toFixed(2)} kg</span>
                        </div>

                        {/* Discount Breakdown */}
                        {calculationResult.value.discount_breakdown && calculationResult.value.discount_breakdown.length > 0 && (
                            <div class="bg-yellow-50 p-3 rounded text-sm space-y-2">
                                <div class="font-semibold text-yellow-800 mb-1">Descuentos Aplicados:</div>
                                {calculationResult.value.discount_breakdown.map((d: any, idx: number) => (
                                    <div key={idx} class="flex justify-between text-yellow-700">
                                        <span>{d.quality_metric} ({d.value}%):</span>
                                        <span>-{d.weight_deduction.toFixed(2)} kg</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div class="flex justify-between items-center text-sm font-medium pt-2 border-t">
                            <span>Peso Final (Neto):</span>
                            <span class="text-blue-600">
                                {(totalWeight - (calculationResult.value.total_weight_deduction || 0)).toFixed(2)} kg
                            </span>
                        </div>

                        <div class="flex justify-between items-center text-sm">
                            <span class="text-gray-600">Precio Base:</span>
                            <span>RD$ {basePricePerKg.toFixed(2)} / kg</span>
                        </div>

                        <div class="flex justify-between items-center text-xl font-bold pt-3 border-t border-gray-200 mt-2">
                            <span>Total a Pagar:</span>
                            <span class="text-green-600">
                                RD$ {calculationResult.value.final_total.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
});
