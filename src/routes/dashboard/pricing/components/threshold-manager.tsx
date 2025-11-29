import { component$, useSignal, $ } from '@builder.io/qwik';
import { Form } from '@builder.io/qwik-city';
import { PencilIcon, TrashIcon, PlusIcon, XIcon } from 'lucide-qwik';

interface Props {
    fruitType: string;
    pricingRuleId: string;
    thresholds: any[];
    createAction: any;
    updateAction: any;
    deleteAction: any;
    onClose$: any;
}

export const ThresholdManager = component$<Props>(({
    fruitType,
    pricingRuleId,
    thresholds,
    createAction,
    updateAction,
    deleteAction,
    onClose$
}) => {
    const isEditing = useSignal<string | null>(null);
    const showForm = useSignal(false);

    // Form state
    const metric = useSignal<string>('Moho');
    const limitValue = useSignal<string>('');

    const resetForm = $(() => {
        isEditing.value = null;
        showForm.value = false;
        metric.value = 'Moho';
        limitValue.value = '';
    });

    const handleEdit = $((threshold: any) => {
        isEditing.value = threshold.id;
        metric.value = threshold.quality_metric;
        limitValue.value = threshold.limit_value.toString();
        showForm.value = true;
    });

    return (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between p-4 border-b">
                    <h3 class="text-xl font-semibold text-gray-900">
                        Configurar Umbrales - {fruitType}
                    </h3>
                    <button
                        onClick$={onClose$}
                        class="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <XIcon class="w-6 h-6" />
                    </button>
                </div>

                <div class="p-6 space-y-6">
                    <div class="flex justify-between items-center">
                        <h4 class="text-lg font-medium">Umbrales de Descuento</h4>
                        {!showForm.value && (
                            <button
                                onClick$={() => showForm.value = true}
                                class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <PlusIcon class="w-4 h-4 mr-2" />
                                Nuevo Umbral
                            </button>
                        )}
                    </div>

                    {showForm.value && (
                        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h5 class="font-medium mb-3">
                                {isEditing.value ? 'Editar Umbral' : 'Nuevo Umbral'}
                            </h5>

                            <Form
                                action={isEditing.value ? updateAction : createAction}
                                onSubmitCompleted$={resetForm}
                                class="space-y-4"
                            >
                                {isEditing.value && (
                                    <input type="hidden" name="id" value={isEditing.value} />
                                )}
                                <input type="hidden" name="pricingRuleId" value={pricingRuleId} />

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label for="metric" class="block text-sm font-medium text-gray-700 mb-1">
                                            Métrica de Calidad
                                        </label>
                                        <select
                                            id="metric"
                                            name="qualityMetric"
                                            bind:value={metric}
                                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                            disabled={!!isEditing.value}
                                        >
                                            <option value="Moho">Moho</option>
                                            <option value="Humedad">Humedad</option>
                                            <option value="Violetas">Violetas</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label for="limit" class="block text-sm font-medium text-gray-700 mb-1">
                                            Valor Límite (%)
                                        </label>
                                        <input
                                            type="number"
                                            id="limit"
                                            name="limitValue"
                                            bind:value={limitValue}
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            required
                                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                            placeholder="Ej: 5.00"
                                        />
                                    </div>
                                </div>

                                <div class="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick$={resetForm}
                                        class="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        class="px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        {isEditing.value ? 'Actualizar' : 'Guardar'}
                                    </button>
                                </div>
                            </Form>
                        </div>
                    )}

                    <div class="overflow-x-auto border rounded-lg">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Métrica
                                    </th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Límite (%)
                                    </th>
                                    <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                {thresholds.map((threshold) => (
                                    <tr key={threshold.id}>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {threshold.qualityMetric || threshold.quality_metric}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {threshold.limitValue || threshold.limit_value}%
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div class="flex justify-end gap-2">
                                                <button
                                                    onClick$={() => handleEdit(threshold)}
                                                    class="text-blue-600 hover:text-blue-900"
                                                >
                                                    <PencilIcon class="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick$={() => {
                                                        if (confirm('¿Está seguro de eliminar este umbral?')) {
                                                            deleteAction.submit({ id: threshold.id });
                                                        }
                                                    }}
                                                    class="text-red-600 hover:text-red-900"
                                                >
                                                    <TrashIcon class="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {thresholds.length === 0 && (
                                    <tr>
                                        <td colSpan={3} class="px-6 py-4 text-center text-sm text-gray-500">
                                            No hay umbrales configurados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
});
