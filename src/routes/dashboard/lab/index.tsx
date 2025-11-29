import { component$ } from '@builder.io/qwik';
import { routeLoader$, Link } from '@builder.io/qwik-city';
import { getAllLabSamples } from '~/lib/actions/lab/samples';
import { FlaskConicalIcon, ArrowRightIcon } from 'lucide-qwik';

export const useLabSamples = routeLoader$(async () => {
    const samples = await getAllLabSamples();
    return samples;
});

export default component$(() => {
    const samples = useLabSamples();

    return (
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Laboratorio</h1>
                    <p class="text-gray-600 mt-1">Gestión de muestras y análisis de calidad</p>
                </div>
            </div>

            <div class="grid gap-6 md:grid-cols-3">
                <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div class="flex items-center gap-4">
                        <div class="p-3 bg-blue-100 text-blue-600 rounded-full">
                            <FlaskConicalIcon class="w-6 h-6" />
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-600">Muestras en Secado</p>
                            <h3 class="text-2xl font-bold text-gray-900">
                                {samples.value.filter(s => s.status === 'Drying').length}
                            </h3>
                        </div>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div class="flex items-center gap-4">
                        <div class="p-3 bg-yellow-100 text-yellow-600 rounded-full">
                            <FlaskConicalIcon class="w-6 h-6" />
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-600">Pendiente Análisis</p>
                            <h3 class="text-2xl font-bold text-gray-900">
                                {samples.value.filter(s => s.status === 'Analysis').length}
                            </h3>
                        </div>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div class="flex items-center gap-4">
                        <div class="p-3 bg-green-100 text-green-600 rounded-full">
                            <FlaskConicalIcon class="w-6 h-6" />
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-600">Completadas</p>
                            <h3 class="text-2xl font-bold text-gray-900">
                                {samples.value.filter(s => s.status === 'Completed').length}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div class="p-6 border-b border-gray-200">
                    <h2 class="text-lg font-semibold text-gray-900">Muestras Recientes</h2>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left">
                        <thead class="bg-gray-50 text-gray-700 font-medium border-b">
                            <tr>
                                <th class="px-6 py-3">ID Muestra</th>
                                <th class="px-6 py-3">Recepción</th>
                                <th class="px-6 py-3">Proveedor</th>
                                <th class="px-6 py-3">Estado</th>
                                <th class="px-6 py-3">Peso Muestra</th>
                                <th class="px-6 py-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            {samples.value.length === 0 ? (
                                <tr>
                                    <td colSpan={6} class="px-6 py-8 text-center text-gray-500">
                                        No hay muestras registradas
                                    </td>
                                </tr>
                            ) : (
                                samples.value.map((sample) => (
                                    <tr key={sample.id} class="hover:bg-gray-50">
                                        <td class="px-6 py-4 font-medium text-gray-900">
                                            {sample.id.slice(0, 8)}...
                                        </td>
                                        <td class="px-6 py-4">
                                            {sample.reception?.receptionNumber || '-'}
                                        </td>
                                        <td class="px-6 py-4">
                                            {sample.reception?.provider?.name || '-'}
                                        </td>
                                        <td class="px-6 py-4">
                                            <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                ${sample.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                    sample.status === 'Analysis' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-blue-100 text-blue-800'}`}>
                                                {sample.status === 'Drying' ? 'En Secado' :
                                                    sample.status === 'Analysis' ? 'En Análisis' : 'Completado'}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4">
                                            {sample.sampleWeight} kg
                                        </td>
                                        <td class="px-6 py-4">
                                            <Link href={`/dashboard/lab/samples/${sample.id}`}>
                                                <button class="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center">
                                                    Ver Detalles
                                                    <ArrowRightIcon class="w-4 h-4 ml-1" />
                                                </button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
});
