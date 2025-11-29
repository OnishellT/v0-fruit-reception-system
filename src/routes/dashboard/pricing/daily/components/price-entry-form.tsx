import { component$ } from '@builder.io/qwik';
import { Form } from '@builder.io/qwik-city';
import { PlusIcon } from 'lucide-qwik';

interface Props {
    fruitTypes: any[];
    createAction: any;
}

export const PriceEntryForm = component$<Props>(({ fruitTypes, createAction }) => {
    return (
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">
                Nuevo Precio Diario
            </h3>

            <Form action={createAction} class="space-y-4">
                <div>
                    <label for="fruitTypeId" class="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Fruto
                    </label>
                    <select
                        id="fruitTypeId"
                        name="fruitTypeId"
                        required
                        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="" disabled selected>Seleccione un tipo</option>
                        {fruitTypes.map(type => (
                            <option key={type.id} value={type.id}>
                                {type.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label for="priceDate" class="block text-sm font-medium text-gray-700 mb-1">
                        Fecha
                    </label>
                    <input
                        id="priceDate"
                        name="priceDate"
                        type="date"
                        required
                        value={new Date().toISOString().split('T')[0]}
                        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label for="pricePerKg" class="block text-sm font-medium text-gray-700 mb-1">
                        Precio por Kg (DOP)
                    </label>
                    <input
                        id="pricePerKg"
                        name="pricePerKg"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        placeholder="0.00"
                        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <button
                    type="submit"
                    class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={createAction.isRunning}
                >
                    <PlusIcon class="w-4 h-4 mr-2" />
                    {createAction.isRunning ? 'Guardando...' : 'Registrar Precio'}
                </button>

                {createAction.value?.failed && (
                    <div class="text-sm text-red-600 mt-2">
                        Error al guardar el precio. Intente nuevamente.
                    </div>
                )}

                {createAction.value?.success && (
                    <div class="text-sm text-green-600 mt-2">
                        Precio registrado exitosamente.
                    </div>
                )}
            </Form>
        </div>
    );
});
