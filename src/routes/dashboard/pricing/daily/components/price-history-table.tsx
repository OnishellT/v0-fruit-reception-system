import { component$ } from '@builder.io/qwik';

interface Props {
    fruitTypes: any[];
    prices: Record<string, any[]>;
}

export const PriceHistoryTable = component$<Props>(({ fruitTypes, prices }) => {
    return (
        <div class="space-y-6">
            {fruitTypes.map(type => {
                const typePrices = prices[type.id] || [];
                if (typePrices.length === 0) return null;

                return (
                    <div key={type.id} class="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div class="flex items-center justify-between p-4 border-b">
                            <h4 class="text-lg font-bold text-gray-900">
                                Historial - {type.name}
                            </h4>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {typePrices.length} registros
                            </span>
                        </div>

                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio (DOP)</th>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registrado Por</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    {typePrices.map((price) => (
                                        <tr key={price.id}>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {new Date(price.priceDate).toLocaleDateString('es-DO')}
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                RD$ {Number(price.pricePerKg).toFixed(2)}
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                                {price.active ? (
                                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Activo
                                                    </span>
                                                ) : (
                                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        Inactivo
                                                    </span>
                                                )}
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span class="text-xs">
                                                    {new Date(price.createdAt).toLocaleString('es-DO')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}

            {Object.values(prices).every(p => p.length === 0) && (
                <div class="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p class="text-gray-500">
                        No hay historial de precios registrado.
                    </p>
                </div>
            )}
        </div>
    );
});
