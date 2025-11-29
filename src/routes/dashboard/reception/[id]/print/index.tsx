import { component$, useVisibleTask$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { receptions, receptionDetails, qualityEvaluations, laboratorySamples, providers, drivers, fruitTypes } from '~/lib/db/schema';
import { eq } from 'drizzle-orm';

export const useReceptionPrintDetails = routeLoader$(async ({ params, redirect }) => {
    const receptionId = params.id; // UUID string

    const [reception] = await db.select({
        receptionNumber: receptions.receptionNumber,
        receptionDate: receptions.receptionDate,
        totalContainers: receptions.totalContainers,
        totalWeight: receptions.totalPesoOriginal, // Alias for compatibility
        truckPlate: receptions.truckPlate,
        providerName: providers.name,
        providerCode: providers.code,
        driverName: drivers.name,
        fruitType: fruitTypes.type,
        // fruitSubtype is not directly available in simple join unless in reception or fruitTypes
        // Assuming fruitType.name covers it for now or adding subtype if available
        status: receptions.status,
    })
        .from(receptions)
        .leftJoin(providers, eq(receptions.providerId, providers.id))
        .leftJoin(drivers, eq(receptions.driverId, drivers.id))
        .leftJoin(fruitTypes, eq(receptions.fruitTypeId, fruitTypes.id))
        .where(eq(receptions.id, receptionId));

    if (!reception) throw redirect(302, '/dashboard/reception');

    const details = await db.select({
        id: receptionDetails.id,
        lineNumber: receptionDetails.lineNumber,
        quantity: receptionDetails.quantity,
        weightKg: receptionDetails.weightKg,
        fruitType: fruitTypes.type,
    })
        .from(receptionDetails)
        .leftJoin(fruitTypes, eq(receptionDetails.fruitTypeId, fruitTypes.id))
        .where(eq(receptionDetails.receptionId, receptionId))
        .orderBy(receptionDetails.lineNumber);

    const quality = await db.query.qualityEvaluations.findFirst({
        where: eq(qualityEvaluations.recepcionId, receptionId),
    });

    const labSample = await db.query.laboratorySamples.findFirst({
        where: eq(laboratorySamples.receptionId, receptionId),
    });

    return { reception, details, quality, labSample };
});

export default component$(() => {
    const detailsSignal = useReceptionPrintDetails();
    const { reception, details, quality } = detailsSignal.value;

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(() => {
        setTimeout(() => {
            window.print();
        }, 500);
    });

    return (
        <div class="p-8 max-w-4xl mx-auto bg-white text-black font-sans">
            {/* Header */}
            <div class="text-center mb-8 border-b pb-4">
                <h1 class="text-3xl font-bold uppercase tracking-wide mb-2">Recibo de Recepción</h1>
                <p class="text-sm text-gray-600">Comprobante de Entrega de Fruta</p>
            </div>

            {/* Info Grid */}
            <div class="grid grid-cols-2 gap-x-12 gap-y-4 mb-8 text-sm">
                <div>
                    <span class="font-bold block text-gray-500 uppercase text-xs">N° Recepción</span>
                    <span class="text-lg">{reception.receptionNumber}</span>
                </div>
                <div class="text-right">
                    <span class="font-bold block text-gray-500 uppercase text-xs">Fecha</span>
                    <span class="text-lg">{new Date(reception.receptionDate).toLocaleDateString()} {new Date(reception.receptionDate).toLocaleTimeString()}</span>
                </div>

                <div>
                    <span class="font-bold block text-gray-500 uppercase text-xs">Proveedor</span>
                    <span class="text-lg">{reception.providerCode} - {reception.providerName}</span>
                </div>
                <div class="text-right">
                    <span class="font-bold block text-gray-500 uppercase text-xs">Conductor</span>
                    <span class="text-lg">{reception.driverName}</span>
                </div>

                <div>
                    <span class="font-bold block text-gray-500 uppercase text-xs">Placa Vehículo</span>
                    <span class="text-lg">{reception.truckPlate}</span>
                </div>
                <div class="text-right">
                    <span class="font-bold block text-gray-500 uppercase text-xs">Tipo de Fruto</span>
                    <span class="text-lg">{reception.fruitType}</span>
                </div>
            </div>

            {/* Details Table */}
            <div class="mb-8">
                <h3 class="font-bold uppercase text-xs text-gray-500 mb-2 border-b pb-1">Detalles de Pesada</h3>
                <table class="w-full text-sm">
                    <thead>
                        <tr class="border-b-2 border-black">
                            <th class="text-left py-2">#</th>
                            <th class="text-left py-2">Tipo</th>
                            <th class="text-right py-2">Cantidad</th>
                            <th class="text-right py-2">Peso (kg)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {details.map((d) => (
                            <tr key={d.id} class="border-b border-gray-200">
                                <td class="py-2">{d.lineNumber}</td>
                                <td class="py-2">{d.fruitType}</td>
                                <td class="py-2 text-right">{d.quantity}</td>
                                <td class="py-2 text-right">{Number(d.weightKg).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr class="font-bold border-t-2 border-black text-base">
                            <td colSpan={2} class="py-3 text-right pr-4">Totales:</td>
                            <td class="py-3 text-right">{reception.totalContainers}</td>
                            <td class="py-3 text-right">{Number(reception.totalWeight).toFixed(2)} kg</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Quality Section */}
            {quality && (
                <div class="mb-8">
                    <h3 class="font-bold uppercase text-xs text-gray-500 mb-2 border-b pb-1">Evaluación de Calidad</h3>
                    <div class="flex gap-8 text-sm">
                        <div class="border rounded p-3 flex-1 text-center">
                            <span class="block text-gray-500 text-xs uppercase">Violetas</span>
                            <span class="font-bold text-lg">{Number(quality.violetas).toFixed(2)}%</span>
                        </div>
                        <div class="border rounded p-3 flex-1 text-center">
                            <span class="block text-gray-500 text-xs uppercase">Humedad</span>
                            <span class="font-bold text-lg">{Number(quality.humedad).toFixed(2)}%</span>
                        </div>
                        <div class="border rounded p-3 flex-1 text-center">
                            <span class="block text-gray-500 text-xs uppercase">Moho</span>
                            <span class="font-bold text-lg">{Number(quality.moho).toFixed(2)}%</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Signatures */}
            <div class="mt-16 grid grid-cols-2 gap-12">
                <div class="text-center">
                    <div class="border-t border-black pt-2 w-3/4 mx-auto"></div>
                    <p class="text-sm font-bold">Entregado por</p>
                    <p class="text-xs text-gray-500">{reception.driverName}</p>
                </div>
                <div class="text-center">
                    <div class="border-t border-black pt-2 w-3/4 mx-auto"></div>
                    <p class="text-sm font-bold">Recibido por</p>
                    <p class="text-xs text-gray-500">Operador de Recepción</p>
                </div>
            </div>

            {/* Footer */}
            <div class="mt-12 text-center text-xs text-gray-400">
                <p>Generado por Sistema de Recepción de Fruta - {new Date().toLocaleString()}</p>
            </div>
        </div>
    );
});
