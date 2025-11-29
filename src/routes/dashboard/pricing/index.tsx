
import { component$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, zod$, z } from '@builder.io/qwik-city';
import { DollarSignIcon } from 'lucide-qwik';
import { requireAdmin } from '~/lib/actions/common';
import {
    getPricingRulesByFruitType,
    updatePricingRulesUtil
} from '~/lib/actions/pricing/rules';
import { PricingRulesTable } from './components/pricing-rules-table';

import {
    getAllDiscountThresholds,
    createDiscountThresholdUtil,
    updateDiscountThresholdUtil,
    deleteDiscountThresholdUtil
} from '~/lib/actions/pricing/thresholds';

// Load all pricing rules and thresholds
export const usePricingRules = routeLoader$(async (requestEvent) => {
    requireAdmin(requestEvent.cookie);
    // requireAdmin throws if not authorized, so we can proceed

    const fruitTypes = ['CAFÉ', 'CACAO', 'MIEL', 'COCOS'];

    // Load rules
    const rulesPromises = fruitTypes.map(type =>
        getPricingRulesByFruitType(type)
    );

    // Load thresholds
    const thresholdsPromises = fruitTypes.map(type =>
        getAllDiscountThresholds(type)
    );

    const [rulesResults, thresholdsResults] = await Promise.all([
        Promise.all(rulesPromises),
        Promise.all(thresholdsPromises)
    ]);

    return {
        rules: rulesResults.reduce((acc, result, idx) => {
            if (result.success && result.data) {
                acc[fruitTypes[idx]] = result.data;
            }
            return acc;
        }, {} as Record<string, any>),
        thresholds: thresholdsResults.reduce((acc, result, idx) => {
            if (result.success && result.data) {
                acc[fruitTypes[idx]] = result.data;
            }
            return acc;
        }, {} as Record<string, any[]>),
        fruitTypes
    };
});

// Toggle pricing rule
export const useTogglePricing = routeAction$(async (data, requestEvent) => {
    const admin = requireAdmin(requestEvent.cookie);

    return await updatePricingRulesUtil({
        fruit_type: data.fruitType as any,
        quality_based_pricing_enabled: data.enabled
    }, admin.id);
}, zod$({
    fruitType: z.string(),
    enabled: z.boolean()
}));

// Create threshold
export const useCreateThreshold = routeAction$(async (data, requestEvent) => {
    const admin = requireAdmin(requestEvent.cookie);

    return await createDiscountThresholdUtil({
        pricing_rule_id: data.pricingRuleId,
        quality_metric: data.qualityMetric,
        limit_value: data.limitValue
    }, admin.id);
}, zod$({
    pricingRuleId: z.string(),
    qualityMetric: z.enum(['Moho', 'Humedad', 'Violetas']),
    limitValue: z.number().min(0).max(100)
}));

// Update threshold
export const useUpdateThreshold = routeAction$(async (data, requestEvent) => {
    const admin = requireAdmin(requestEvent.cookie);

    return await updateDiscountThresholdUtil({
        id: data.id,
        limit_value: data.limitValue
    }, admin.id);
}, zod$({
    id: z.string(),
    limitValue: z.number().min(0).max(100)
}));

// Delete threshold
export const useDeleteThreshold = routeAction$(async (data, requestEvent) => {
    requireAdmin(requestEvent.cookie);

    return await deleteDiscountThresholdUtil(data.id);
}, zod$({
    id: z.string()
}));

export default component$(() => {
    const rules = usePricingRules();
    const toggleAction = useTogglePricing();
    const createAction = useCreateThreshold();
    const updateAction = useUpdateThreshold();
    const deleteAction = useDeleteThreshold();

    return (
        <div class="container mx-auto px-4 py-8">
            <div class="mb-8">
                <div class="flex items-center gap-3 mb-2">
                    <DollarSignIcon class="h-8 w-8 text-blue-600" />
                    <h1 class="text-3xl font-bold">
                        Configuración de Precios por Calidad
                    </h1>
                </div>
                <p class="text-gray-600">
                    Configure umbrales de descuento basados en métricas de calidad para cada tipo de fruto.
                    Los descuentos se aplican automáticamente durante el proceso de recepción.
                </p>
            </div>

            <PricingRulesTable
                rules={rules.value.rules}
                thresholds={rules.value.thresholds}
                toggleAction={toggleAction}
                createAction={createAction}
                updateAction={updateAction}
                deleteAction={deleteAction}
            />
        </div>
    );
});
