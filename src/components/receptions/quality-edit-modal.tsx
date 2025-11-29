
import { component$, useSignal, $ } from '@builder.io/qwik';
import { Form } from '@builder.io/qwik-city';
import { XIcon } from 'lucide-qwik';

interface QualityEditModalProps {
    receptionId: string;
    initialValues: {
        humedad?: number;
        moho?: number;
        violetas?: number;
    };
    onClose: any;
    onSuccess: any;
}

export const QualityEditModal = component$<QualityEditModalProps>(({ receptionId, initialValues, onClose, onSuccess }) => {
    const isSubmitting = useSignal(false);
    const error = useSignal('');

    const handleSubmit = $(async (e: Event) => {
        e.preventDefault();
        isSubmitting.value = true;
        error.value = '';

        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            // We'll call the server action passed via props or context, 
            // but for now let's assume the parent handles the actual submission via a Qwik City action
            // or we use a fetch to an endpoint.
            // Actually, best practice in Qwik is to use the routeAction in the parent and pass the submit function,
            // or just use a Form if it's a route action.
            // However, since this is a modal, we might want to use `fetch` to a custom endpoint or 
            // use the `useUpdateQualityMetrics` action from the parent.

            // Let's assume the parent passes a submit handler or we use the action directly if imported.
            // But we can't import routeAction here easily if it's defined in the route.
            // So we'll emit an event with the data.

            await onSuccess({
                receptionId,
                humedad: data.humedad,
                moho: data.moho,
                violetas: data.violetas
            });

            onClose();
        } catch (err) {
            console.error(err);
            error.value = 'Failed to save quality metrics';
        } finally {
            isSubmitting.value = false;
        }
    });

    return (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                <div class="mb-4 flex items-center justify-between">
                    <h2 class="text-xl font-semibold text-gray-900">Editar Calidad</h2>
                    <button onClick$={onClose} class="text-gray-500 hover:text-gray-700">
                        <XIcon class="h-6 w-6" />
                    </button>
                </div>

                {error.value && (
                    <div class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
                        {error.value}
                    </div>
                )}

                <form onSubmit$={handleSubmit} class="space-y-4">
                    <input type="hidden" name="receptionId" value={receptionId} />

                    <div>
                        <label class="block text-sm font-medium text-gray-700">Humedad (%)</label>
                        <input
                            type="number"
                            name="humedad"
                            step="0.01"
                            min="0"
                            max="100"
                            value={initialValues.humedad}
                            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700">Moho (%)</label>
                        <input
                            type="number"
                            name="moho"
                            step="0.01"
                            min="0"
                            max="100"
                            value={initialValues.moho}
                            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700">Violetas (%)</label>
                        <input
                            type="number"
                            name="violetas"
                            step="0.01"
                            min="0"
                            max="100"
                            value={initialValues.violetas}
                            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div class="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick$={onClose}
                            class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting.value}
                            class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSubmitting.value ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});
