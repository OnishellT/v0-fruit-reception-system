import { component$, useSignal } from '@builder.io/qwik';
import { ThresholdManager } from './threshold-manager';
import { SettingsIcon, ToggleLeftIcon, ToggleRightIcon } from 'lucide-qwik';

interface Props {
    rules: Record<string, any>;
    thresholds: Record<string, any[]>;
    toggleAction: any;
    createAction: any;
    updateAction: any;
    deleteAction: any;
}

export const PricingRulesTable = component$<Props>(({
    rules,
    thresholds,
    toggleAction,
    createAction,
    updateAction,
    deleteAction
}) => {
    const selectedFruitType = useSignal<string | null>(null);

    return (
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tipo de Fruto
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Umbrales Configurados
                            </th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        {Object.entries(rules).map(([type, rule]) => (
                            <tr key={type}>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {type}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {rule.quality_based_pricing_enabled ? (
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
                                    {thresholds[type]?.length || 0} reglas
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div class="flex justify-end gap-2">
                                        <button
                                            onClick$={() => {
                                                toggleAction.submit({
                                                    fruitType: type,
                                                    enabled: !rule.quality_based_pricing_enabled
                                                });
                                            }}
                                            class={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${rule.quality_based_pricing_enabled
                                                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                                    : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                                                }`}
                                        >
                                            {rule.quality_based_pricing_enabled ? (
                                                <>
                                                    <ToggleRightIcon class="w-4 h-4 mr-1" />
                                                    Desactivar
                                                </>
                                            ) : (
                                                <>
                                                    <ToggleLeftIcon class="w-4 h-4 mr-1" />
                                                    Activar
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick$={() => selectedFruitType.value = type}
                                            class="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            <SettingsIcon class="w-4 h-4 mr-1" />
                                            Configurar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedFruitType.value && (
                <ThresholdManager
                    fruitType={selectedFruitType.value}
                    pricingRuleId={rules[selectedFruitType.value].id}
                    thresholds={thresholds[selectedFruitType.value] || []}
                    createAction={createAction}
                    updateAction={updateAction}
                    deleteAction={deleteAction}
                    onClose$={() => selectedFruitType.value = null}
                />
            )}
        </div>
    );
});
