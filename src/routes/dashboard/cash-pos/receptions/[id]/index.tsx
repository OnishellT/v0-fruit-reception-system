import { component$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, useNavigate, z, zod$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { cashReceptions, cashReceptionDetails, cashCustomers, cashFruitTypes } from '~/lib/db/schema';
import { eq } from 'drizzle-orm';
import { PrinterIcon, ArrowLeftIcon, DownloadIcon } from 'lucide-qwik';
import type { CashReceiptData } from '~/lib/jsreport/types';
import { downloadFile } from '~/lib/utils/download';

export const useReceptionDetails = routeLoader$(async ({ params, redirect }) => {
    const id = parseInt(params.id);
    if (isNaN(id)) throw redirect(302, '/dashboard/cash-pos/receptions');

    const [reception] = await db
        .select({
            id: cashReceptions.id,
            receptionDate: cashReceptions.receptionDate,
            containersCount: cashReceptions.containersCount,
            totalWeightKgOriginal: cashReceptions.totalWeightKgOriginal,
            totalWeightKgFinal: cashReceptions.totalWeightKgFinal,
            pricePerKgSnapshot: cashReceptions.pricePerKgSnapshot,
            calidadHumedad: cashReceptions.calidadHumedad,
            calidadMoho: cashReceptions.calidadMoho,
            calidadVioletas: cashReceptions.calidadVioletas,
            discountPercentTotal: cashReceptions.discountPercentTotal,
            discountWeightKg: cashReceptions.discountWeightKg,
            grossAmount: cashReceptions.grossAmount,
            netAmount: cashReceptions.netAmount,
            discountBreakdown: cashReceptions.discountBreakdown,
            createdAt: cashReceptions.createdAt,
            createdBy: cashReceptions.createdBy,
            customerName: cashCustomers.name,
            customerNationalId: cashCustomers.nationalId,
            fruitTypeName: cashFruitTypes.name,
        })
        .from(cashReceptions)
        .innerJoin(cashCustomers, eq(cashReceptions.customerId, cashCustomers.id))
        .innerJoin(cashFruitTypes, eq(cashReceptions.fruitTypeId, cashFruitTypes.id))
        .where(eq(cashReceptions.id, id))
        .limit(1);

    if (!reception) throw redirect(302, '/dashboard/cash-pos/receptions');

    // Fetch weighing details
    const weighings = await db
        .select()
        .from(cashReceptionDetails)
        .where(eq(cashReceptionDetails.receptionId, id))
        .orderBy(cashReceptionDetails.weighingNumber);

    return { reception, weighings };
});

export const useDownloadReceiptPDF = routeAction$(async ({ id }, { cookie }) => {
    const session = cookie.get('user_session')?.json() as { id: string; fullName: string };
    if (!session) return { success: false, message: 'No autorizado' };

    // Fetch reception data
    const [reception] = await db
        .select({
            id: cashReceptions.id,
            customerName: cashCustomers.name,
            customerNationalId: cashCustomers.nationalId,
            fruitTypeName: cashFruitTypes.name,
            receptionDate: cashReceptions.receptionDate,
            containersCount: cashReceptions.containersCount,
            totalWeightKgOriginal: cashReceptions.totalWeightKgOriginal,
            totalWeightKgFinal: cashReceptions.totalWeightKgFinal,
            discountWeightKg: cashReceptions.discountWeightKg,
            discountPercentTotal: cashReceptions.discountPercentTotal,
            pricePerKgSnapshot: cashReceptions.pricePerKgSnapshot,
            grossAmount: cashReceptions.grossAmount,
            netAmount: cashReceptions.netAmount,
            calidadHumedad: cashReceptions.calidadHumedad,
            calidadMoho: cashReceptions.calidadMoho,
            calidadVioletas: cashReceptions.calidadVioletas,
            discountBreakdown: cashReceptions.discountBreakdown,
        })
        .from(cashReceptions)
        .innerJoin(cashCustomers, eq(cashReceptions.customerId, cashCustomers.id))
        .innerJoin(cashFruitTypes, eq(cashReceptions.fruitTypeId, cashFruitTypes.id))
        .where(eq(cashReceptions.id, parseInt(id)))
        .limit(1);

    if (!reception) return { success: false, message: 'Recepción no encontrada' };

    // Prepare data for JSReport
    const reportData: CashReceiptData = {
        reception: {
            ...reception,
            receptionDate: reception.receptionDate.toISOString(),
            totalWeightKgOriginal: Number(reception.totalWeightKgOriginal),
            totalWeightKgFinal: Number(reception.totalWeightKgFinal),
            discountWeightKg: Number(reception.discountWeightKg),
            discountPercentTotal: Number(reception.discountPercentTotal),
            pricePerKgSnapshot: Number(reception.pricePerKgSnapshot),
            grossAmount: Number(reception.grossAmount),
            netAmount: Number(reception.netAmount),
            qualityMetrics: reception.calidadHumedad || reception.calidadMoho || reception.calidadVioletas
                ? {
                    humedad: reception.calidadHumedad ? Number(reception.calidadHumedad) : undefined,
                    moho: reception.calidadMoho ? Number(reception.calidadMoho) : undefined,
                    violetas: reception.calidadVioletas ? Number(reception.calidadVioletas) : undefined,
                }
                : undefined,
            discountBreakdown: Object.entries(reception.discountBreakdown || {}).map(([key, value]: [string, any]) => ({
                parametro: key,
                valor: value.valor,
                umbral: value.umbral,
                porcentajeDescuento: value.porcentajeDescuento,
                pesoDescuento: value.pesoDescuento,
            })),
        },
        metadata: {
            generatedAt: new Date().toISOString(),
            generatedBy: session.fullName || session.id,
        },
    };

    try {
        // Dynamic import to avoid loading JSReport during module initialization
        const { renderCashReceiptPDF } = await import('~/lib/jsreport/render');

        // Render PDF using JSReport
        const pdfBuffer = await renderCashReceiptPDF(reportData);

        return {
            success: true,
            buffer: pdfBuffer.toString('base64'),
            filename: `recibo-${id}.pdf`,
            mimeType: 'application/pdf',
        };
    } catch (error) {
        console.error('Error generating PDF:', error);
        return {
            success: false,
            message: 'Error al generar el PDF: ' + (error instanceof Error ? error.message : 'Unknown error')
        };
    }
}, zod$({ id: z.string() }));

export default component$(() => {
    const data = useReceptionDetails();
    const downloadAction = useDownloadReceiptPDF();
    const nav = useNavigate();

    const { reception, weighings } = data.value;
    const discountBreakdown = reception.discountBreakdown as Record<string, any> || {};

    return (
        <>
            {/* Receipt Printer Styles */}
            <style dangerouslySetInnerHTML={`
                @media print {
                    @page {
                        size: 80mm auto;
                        margin: 5mm;
                    }
                    body {
                        width: 80mm;
                        font-size: 10pt;
                        line-height: 1.3;
                    }
                    * {
                        box-shadow: none !important;
                        border-radius: 0 !important;
                    }
                    .print\\:text-xs { font-size: 8pt !important; }
                    .print\\:text-sm { font-size: 9pt !important; }
                    .print\\:text-base { font-size: 10pt !important; }
                    .print\\:py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
                    .print\\:my-2 { margin-top: 0.5rem; margin-bottom: 0.5rem; }
                    h1, h2, h3 { page-break-after: avoid; }
                    table { page-break-inside: avoid; }
                }
            `} />

            <div class="space-y-6 print:space-y-2 print:max-w-[80mm] print:mx-auto">
                {/* Header - Hide on print */}
                <div class="flex items-center justify-between print:hidden">
                    <div class="flex items-center gap-4">
                        <button
                            onClick$={() => nav('/dashboard/cash-pos/receptions')}
                            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-2"
                        >
                            <ArrowLeftIcon class="h-4 w-4" />
                            Volver
                        </button>
                        <div>
                            <h1 class="text-3xl font-bold text-gray-900">Recepción #{reception.id}</h1>
                            <p class="text-gray-500 mt-1">Detalles de la recepción de efectivo</p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button
                            onClick$={async () => {
                                const result = await downloadAction.submit({ id: reception.id.toString() });
                                if (result.value?.success) {
                                    downloadFile(
                                        result.value.buffer,
                                        result.value.filename,
                                        result.value.mimeType
                                    );
                                } else {
                                    alert(`Error al descargar PDF: ${result.value?.message || 'Error desconocido'}`);
                                }
                            }}
                            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-2"
                        >
                            <DownloadIcon class="h-4 w-4" />
                            Descargar PDF
                        </button>
                        <button
                            onClick$={() => window.print()}
                            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2"
                        >
                            <PrinterIcon class="h-4 w-4" />
                            Imprimir Recibo
                        </button>
                    </div>
                </div>

                {/* Print Header - Show only on print */}
                <div class="hidden print:block text-center print:mb-2">
                    <h1 class="text-2xl font-bold print:text-base print:mb-1">Recibo de Recepción</h1>
                    <p class="text-sm text-gray-600 print:text-xs">Efectivo - Recibo #{reception.id}</p>
                </div>

                {/* Reception Info */}
                <div class="bg-white rounded-lg border shadow-sm print:shadow-none print:border-0">
                    <div class="p-6 print:p-2">
                        <h2 class="text-lg font-semibold mb-4 print:text-sm print:mb-1 print:border-b print:border-dashed print:pb-1">Información General</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-1 print:gap-1">
                            <div class="print:text-xs">
                                <label class="text-sm font-medium text-gray-500 print:text-xs print:font-normal">Cliente:</label>
                                <p class="text-base font-semibold print:text-xs print:font-semibold print:inline print:ml-1">{reception.customerName}</p>
                                <p class="text-sm text-gray-600 print:text-xs print:inline"> ({reception.customerNationalId})</p>
                            </div>
                            <div class="print:text-xs">
                                <label class="text-sm font-medium text-gray-500 print:text-xs print:font-normal">Tipo de Fruta:</label>
                                <p class="text-base font-semibold print:text-xs print:font-semibold print:inline print:ml-1">{reception.fruitTypeName}</p>
                            </div>
                            <div class="print:text-xs">
                                <label class="text-sm font-medium text-gray-500 print:text-xs print:font-normal">Fecha:</label>
                                <p class="text-base print:text-xs print:inline print:ml-1">{new Date(reception.receptionDate).toLocaleString('es-DO')}</p>
                            </div>
                            <div class="print:text-xs">
                                <label class="text-sm font-medium text-gray-500 print:text-xs print:font-normal">Envases:</label>
                                <p class="text-base print:text-xs print:inline print:ml-1">{reception.containersCount}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Weighings Breakdown */}
                {weighings.length > 0 && (
                    <div class="bg-white rounded-lg border shadow-sm print:shadow-none print:border-0">
                        <div class="p-6 print:p-2">
                            <h2 class="text-lg font-semibold mb-4 print:text-sm print:mb-1 print:border-b print:border-dashed print:pb-1">Detalle de Pesadas</h2>
                            <div class="relative w-full overflow-auto">
                                <table class="w-full caption-bottom text-sm print:text-xs">
                                    <thead class="[&_tr]:border-b">
                                        <tr class="border-b transition-colors">
                                            <th class="h-10 px-4 text-left align-middle font-medium print:h-auto print:px-1 print:py-1">Pesada #</th>
                                            <th class="h-10 px-4 text-right align-middle font-medium print:h-auto print:px-1 print:py-1">Envases</th>
                                            <th class="h-10 px-4 text-right align-middle font-medium print:h-auto print:px-1 print:py-1">Peso (kg)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {weighings.map((w) => (
                                            <tr key={w.id} class="border-b">
                                                <td class="p-4 align-middle font-medium print:p-1 print:text-xs">{w.weighingNumber}</td>
                                                <td class="p-4 align-middle text-right font-mono print:p-1">{w.containersCount}</td>
                                                <td class="p-4 align-middle text-right font-mono font-bold print:p-1">{Number(w.weightKg).toFixed(3)} kg</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot class="border-t-2 bg-gray-50 print:bg-transparent">
                                        <tr>
                                            <td class="p-4 align-middle font-semibold print:p-1 print:text-xs">Totales:</td>
                                            <td class="p-4 align-middle text-right font-mono font-bold print:p-1">{weighings.reduce((sum, w) => sum + w.containersCount, 0)}</td>
                                            <td class="p-4 align-middle text-right font-mono font-bold text-lg print:p-1 print:text-xs">{weighings.reduce((sum, w) => sum + Number(w.weightKg), 0).toFixed(3)} kg</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Weight & Quality */}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-1 print:gap-2">
                    {/* Weight Details */}
                    <div class="bg-white rounded-lg border shadow-sm print:shadow-none print:border-0">
                        <div class="p-6 print:p-2">
                            <h2 class="text-lg font-semibold mb-4 print:text-sm print:mb-1 print:border-b print:border-dashed print:pb-1">Detalles de Peso</h2>
                            <div class="space-y-3 print:space-y-0.5 print:text-xs">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Peso Original:</span>
                                    <span class="font-mono font-semibold">{Number(reception.totalWeightKgOriginal).toFixed(2)} kg</span>
                                </div>
                                <div class="flex justify-between text-red-600">
                                    <span>Descuento en Peso:</span>
                                    <span class="font-mono font-semibold">-{Number(reception.discountWeightKg).toFixed(2)} kg</span>
                                </div>
                                <div class="border-t pt-2 flex justify-between text-lg print:text-xs print:pt-1 print:font-bold">
                                    <span class="font-semibold">Peso Final:</span>
                                    <span class="font-mono font-bold text-green-600">{Number(reception.totalWeightKgFinal).toFixed(2)} kg</span>
                                </div>
                                <div class="mt-4 pt-4 border-t print:mt-1 print:pt-1">
                                    <div class="flex justify-between text-sm text-gray-600 print:text-xs">
                                        <span>Descuento Total:</span>
                                        <span class="font-semibold">{Number(reception.discountPercentTotal).toFixed(3)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quality Metrics */}
                    <div class="bg-white rounded-lg border shadow-sm print:shadow-none print:border-0">
                        <div class="p-6 print:p-2">
                            <h2 class="text-lg font-semibold mb-4 print:text-sm print:mb-1 print:border-b print:border-dashed print:pb-1">Métricas de Calidad</h2>
                            <div class="space-y-3 print:space-y-0.5 print:text-xs">
                                {reception.calidadHumedad !== null && reception.calidadHumedad !== undefined && (
                                    <div class="flex justify-between">
                                        <span class="text-gray-600">Humedad:</span>
                                        <span class="font-mono font-semibold">{Number(reception.calidadHumedad).toFixed(2)}%</span>
                                    </div>
                                )}
                                {reception.calidadMoho !== null && reception.calidadMoho !== undefined && (
                                    <div class="flex justify-between">
                                        <span class="text-gray-600">Moho:</span>
                                        <span class="font-mono font-semibold">{Number(reception.calidadMoho).toFixed(2)}%</span>
                                    </div>
                                )}
                                {reception.calidadVioletas !== null && reception.calidadVioletas !== undefined && (
                                    <div class="flex justify-between">
                                        <span class="text-gray-600">Violetas:</span>
                                        <span class="font-mono font-semibold">{Number(reception.calidadVioletas).toFixed(2)}%</span>
                                    </div>
                                )}
                                {!reception.calidadHumedad && !reception.calidadMoho && !reception.calidadVioletas && (
                                    <p class="text-sm text-gray-500 italic print:text-xs">No se registraron métricas de calidad</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing Details */}
                <div class="bg-white rounded-lg border shadow-sm print:shadow-none print:border-0">
                    <div class="p-6 print:p-2">
                        <h2 class="text-lg font-semibold mb-4 print:text-sm print:mb-1 print:border-b print:border-dashed print:pb-1">Cálculo de Pago</h2>
                        <div class="space-y-3 print:space-y-0.5 print:text-xs">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Precio por Kg:</span>
                                <span class="font-mono font-semibold">RD$ {Number(reception.pricePerKgSnapshot).toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Peso Final:</span>
                                <span class="font-mono">{Number(reception.totalWeightKgFinal).toFixed(2)} kg</span>
                            </div>
                            <div class="flex justify-between text-lg border-t pt-2 print:text-xs print:pt-1">
                                <span class="font-semibold">Monto Bruto:</span>
                                <span class="font-mono font-semibold">RD$ {Number(reception.grossAmount).toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between text-lg print:text-sm print:font-bold">
                                <span class="font-bold text-green-600">Monto Neto:</span>
                                <span class="font-mono font-bold text-green-600 text-xl print:text-sm">RD$ {Number(reception.netAmount).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Discount Breakdown */}
                {Object.keys(discountBreakdown).length > 0 && (
                    <div class="bg-white rounded-lg border shadow-sm print:shadow-none print:border-0">
                        <div class="p-6 print:p-2">
                            <h2 class="text-lg font-semibold mb-4 print:text-sm print:mb-1 print:border-b print:border-dashed print:pb-1">Desglose de Descuentos</h2>
                            <div class="relative w-full overflow-auto">
                                <table class="w-full caption-bottom text-sm print:text-xs">
                                    <thead class="[&_tr]:border-b">
                                        <tr class="border-b transition-colors">
                                            <th class="h-10 px-4 text-left align-middle font-medium print:h-auto print:px-1 print:py-1">Parámetro</th>
                                            <th class="h-10 px-4 text-right align-middle font-medium print:h-auto print:px-1 print:py-1">Valor</th>
                                            <th class="h-10 px-4 text-right align-middle font-medium print:h-auto print:px-1 print:py-1 print:hidden md:table-cell">Umbral</th>
                                            <th class="h-10 px-4 text-right align-middle font-medium print:h-auto print:px-1 print:py-1">% Desc.</th>
                                            <th class="h-10 px-4 text-right align-middle font-medium print:h-auto print:px-1 print:py-1 print:hidden md:table-cell">Peso Desc.</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(discountBreakdown).map(([key, value]: [string, any]) => (
                                            <tr key={key} class="border-b">
                                                <td class="p-4 align-middle font-medium capitalize print:p-1 print:text-xs">{key}</td>
                                                <td class="p-4 align-middle text-right font-mono print:p-1">{value.valor?.toFixed(2)}%</td>
                                                <td class="p-4 align-middle text-right font-mono print:p-1 print:hidden md:table-cell">{value.umbral?.toFixed(2)}%</td>
                                                <td class="p-4 align-middle text-right font-mono print:p-1">{value.porcentajeDescuento?.toFixed(3)}%</td>
                                                <td class="p-4 align-middle text-right font-mono print:p-1 print:hidden md:table-cell">{value.pesoDescuento?.toFixed(2)} kg</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Info */}
                <div class="bg-gray-50 rounded-lg border p-4 text-sm text-gray-600 print:mt-8">
                    <div class="flex justify-between">
                        <span>Creado: {new Date(reception.createdAt).toLocaleString('es-DO')}</span>
                        <span class="print:hidden">Usuario: {reception.createdBy}</span>
                    </div>
                </div>
            </div>
        </>
    );
});
