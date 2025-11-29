import { component$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, zod$, z } from '@builder.io/qwik-city';
import { DollarSignIcon } from 'lucide-qwik';
import { requireAdmin } from '~/lib/actions/common';
import { db } from '~/lib/db';
import { fruitTypes } from '~/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
    createDailyPriceUtil,
    getActivePricesForFruitType
} from '~/lib/actions/pricing/daily-prices';
import { PriceEntryForm } from './components/price-entry-form';
import { PriceHistoryTable } from './components/price-history-table';

// Load fruit types and prices
export const useDailyPricingData = routeLoader$(async (requestEvent) => {
    requireAdmin(requestEvent.cookie);

    // Load active fruit types
    const types = await db.select().from(fruitTypes).where(eq(fruitTypes.isActive, true));

    // Load active prices for each fruit type
    const pricesPromises = types.map(type =>
        getActivePricesForFruitType(type.id)
    );

    const pricesResults = await Promise.all(pricesPromises);

    const pricesMap = types.reduce((acc, type, idx) => {
        acc[type.id] = pricesResults[idx];
        return acc;
    }, {} as Record<string, any[]>);

    return {
        fruitTypes: types,
        prices: pricesMap
    };
});

// Create daily price
export const useCreateDailyPrice = routeAction$(async (data, requestEvent) => {
    const admin = requireAdmin(requestEvent.cookie);

    return await createDailyPriceUtil({
        fruitTypeId: data.fruitTypeId,
        pricePerKg: data.pricePerKg,
        priceDate: new Date(data.priceDate)
    }, admin.id);
}, zod$({
    fruitTypeId: z.string(),
    pricePerKg: z.number().min(0),
    priceDate: z.string()
}));

export default component$(() => {
    const data = useDailyPricingData();
    const createAction = useCreateDailyPrice();

    return (
        <div class="container mx-auto px-4 py-8">
            <div class="mb-8">
                <div class="flex items-center gap-3 mb-2">
                    <DollarSignIcon class="h-8 w-8 text-blue-600" />
                    <h1 class="text-3xl font-bold">
                        Precios Diarios
                    </h1>
                </div>
                <p class="text-gray-600">
                    Registre los precios base diarios para cada tipo de fruto.
                    Estos precios se utilizarán para calcular el valor bruto de las recepciones.
                </p>
            </div>

            <div class="grid gap-8 lg:grid-cols-3">
                <div class="lg:col-span-1">
                    <PriceEntryForm
                        fruitTypes={data.value.fruitTypes}
                        createAction={createAction}
                    />
                </div>

                <div class="lg:col-span-2">
                    <PriceHistoryTable
                        fruitTypes={data.value.fruitTypes}
                        prices={data.value.prices}
                    />
                </div>
            </div>
        </div>
    );
});
