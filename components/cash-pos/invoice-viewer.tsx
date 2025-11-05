"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface InvoiceViewerProps {
  reception: {
    id: number;
    fruitTypeId: number;
    customerId: number;
    receptionDate: Date;
    containersCount: number;
    totalWeightKgOriginal: string;
    pricePerKgSnapshot: string;
    calidadHumedad?: string;
    calidadMoho?: string;
    calidadVioletas?: string;
    discountPercentTotal: string;
    discountWeightKg: string;
    totalWeightKgFinal: string;
    grossAmount: string;
    netAmount: string;
    discountBreakdown: any;
    createdAt: Date;
    createdBy: string;
    fruitType: {
      code: string;
      name: string;
    };
    customer: {
      name: string;
      nationalId: string;
    };
  };
}

export function InvoiceViewer({ reception }: InvoiceViewerProps) {
  return (
    <div className="max-w-4xl mx-auto bg-white text-xs">
       {/* Invoice Header */}
       <div className="border-b-2 border-gray-800 pb-3 mb-3">
         <div className="flex justify-between items-start">
           <div>
             <h1 className="text-2xl font-bold text-gray-800">FACTURA</h1>
             <p className="text-gray-600 mt-1 text-xs">Recibo de Recepción de Fruta</p>
           </div>
           <div className="text-right">
             <h2 className="text-lg font-bold">#{reception.id.toString().padStart(6, '0')}</h2>
             <p className="text-gray-600 text-xs">Fecha: {format(new Date(reception.receptionDate), "PPP", { locale: require('date-fns/locale/es') })}</p>
           </div>
         </div>
       </div>

       {/* Company Info */}
       <div className="grid grid-cols-2 gap-4 mb-4">
         <div>
           <h3 className="text-sm font-semibold mb-1">De:</h3>
           <div className="text-gray-700 text-xs">
             <p className="font-semibold">Sistema de Recepción de Frutos</p>
             <p>Centro de Procesamiento de Frutas</p>
             <p>Sistema POS en Efectivo</p>
           </div>
         </div>
         <div>
           <h3 className="text-sm font-semibold mb-1">Para:</h3>
           <div className="text-gray-700 text-xs">
             <p className="font-semibold">{reception.customer.name}</p>
             <p>Cédula: {reception.customer.nationalId}</p>
           </div>
         </div>
       </div>

       {/* Reception Details */}
       <Card className="mb-3">
         <CardHeader className="pb-2">
           <CardTitle className="text-sm">Detalles de Recepción</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
             <div>
               <label className="text-xs font-medium text-gray-600">Tipo de Fruta</label>
               <p className="font-semibold text-xs">{reception.fruitType.name}</p>
               <p className="text-xs text-gray-600">({reception.fruitType.code})</p>
             </div>
             <div>
               <label className="text-xs font-medium text-gray-600">Contenedores</label>
               <p className="font-semibold text-xs">{reception.containersCount}</p>
             </div>
             <div>
               <label className="text-xs font-medium text-gray-600">Procesado Por</label>
               <p className="font-semibold text-xs">{reception.createdBy}</p>
             </div>
             <div>
               <label className="text-xs font-medium text-gray-600">Estado</label>
               <Badge className="bg-green-100 text-green-800 text-xs">Completado</Badge>
             </div>
           </div>
         </CardContent>
       </Card>

       {/* Weight & Pricing Table */}
       <Card className="mb-6">
         <CardHeader>
           <CardTitle>Desglose de Peso y Precios</CardTitle>
         </CardHeader>
         <CardContent>
           <table className="w-full">
             <thead>
               <tr className="border-b">
                 <th className="text-left py-2">Descripción</th>
                 <th className="text-right py-2">Peso (kg)</th>
                 <th className="text-right py-2">Precio/kg</th>
                 <th className="text-right py-2">Monto</th>
               </tr>
             </thead>
             <tbody>
               <tr>
                 <td className="py-2">Peso Original</td>
                <td className="text-right py-2 font-mono">
                  {parseFloat(reception.totalWeightKgOriginal).toFixed(3)}
                </td>
                <td className="text-right py-2 font-mono">
                  RD$ {parseFloat(reception.pricePerKgSnapshot).toFixed(2)}
                </td>
                <td className="text-right py-2 font-mono">
                  RD$ {parseFloat(reception.grossAmount).toFixed(2)}
                </td>
              </tr>
               {parseFloat(reception.discountWeightKg) > 0 && (
                 <tr className="text-red-600">
                   <td className="py-2">Descuento por Calidad</td>
                  <td className="text-right py-2 font-mono">
                    -{parseFloat(reception.discountWeightKg).toFixed(3)}
                  </td>
                  <td className="text-right py-2 font-mono">
                    RD$ {parseFloat(reception.pricePerKgSnapshot).toFixed(2)}
                  </td>
                  <td className="text-right py-2 font-mono">
                    -RD$ {(parseFloat(reception.discountWeightKg) * parseFloat(reception.pricePerKgSnapshot)).toFixed(2)}
                  </td>
                </tr>
              )}
              <tr className="border-t-2 font-semibold">
                <td className="py-2">Final Weight</td>
                <td className="text-right py-2 font-mono">
                  {parseFloat(reception.totalWeightKgFinal).toFixed(3)}
                </td>
                <td className="text-right py-2 font-mono">
                  RD$ {parseFloat(reception.pricePerKgSnapshot).toFixed(2)}
                </td>
                <td className="text-right py-2 font-mono">
                  RD$ {parseFloat(reception.netAmount).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Quality Breakdown */}
      {reception.discountBreakdown && Array.isArray(reception.discountBreakdown) && reception.discountBreakdown.length > 0 && (
        <Card className="mb-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Quality Discount Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1 text-xs font-semibold">Metric</th>
                  <th className="text-right py-1 text-xs font-semibold">Threshold</th>
                  <th className="text-right py-1 text-xs font-semibold">Actual</th>
                  <th className="text-right py-1 text-xs font-semibold">Excess %</th>
                  <th className="text-right py-1 text-xs font-semibold">Weight Loss (kg)</th>
                </tr>
              </thead>
              <tbody>
                {reception.discountBreakdown.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="py-1 text-xs">{item.parametro.replace(' (Evaluación)', '')}</td>
                    <td className="text-right py-1 font-mono text-xs">
                      {parseFloat(item.umbral).toFixed(1)}%
                    </td>
                    <td className="text-right py-1 font-mono text-xs">
                      {parseFloat(item.valor).toFixed(1)}%
                    </td>
                    <td className="text-right py-1 font-mono text-xs text-red-600">
                      {parseFloat(item.porcentajeDescuento).toFixed(1)}%
                    </td>
                    <td className="text-right py-1 font-mono text-xs text-red-600">
                      {parseFloat(item.pesoDescuento).toFixed(3)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t bg-red-50 font-semibold">
                  <td className="py-1 text-xs" colSpan={4}>Total Quality Discount</td>
                  <td className="text-right py-1 font-mono text-xs text-red-600">
                    {parseFloat(reception.discountWeightKg).toFixed(3)} kg
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Quality Metrics */}
      {(reception.calidadHumedad || reception.calidadMoho || reception.calidadVioletas) && (
        <Card className="mb-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Quality Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {reception.calidadHumedad && (
                <div className="text-center p-2 bg-gray-50 rounded">
                  <label className="text-xs font-medium text-gray-600">Humidity</label>
                  <p className="text-lg font-bold">{parseFloat(reception.calidadHumedad).toFixed(1)}%</p>
                </div>
              )}
              {reception.calidadMoho && (
                <div className="text-center p-2 bg-gray-50 rounded">
                  <label className="text-xs font-medium text-gray-600">Mold</label>
                  <p className="text-lg font-bold">{parseFloat(reception.calidadMoho).toFixed(1)}%</p>
                </div>
              )}
              {reception.calidadVioletas && (
                <div className="text-center p-2 bg-gray-50 rounded">
                  <label className="text-xs font-medium text-gray-600">Violetas</label>
                  <p className="text-lg font-bold">{parseFloat(reception.calidadVioletas).toFixed(1)}%</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Total Summary */}
      <div className="border-t-2 border-gray-800 pt-3">
        <div className="flex justify-end">
          <div className="w-48">
            <div className="flex justify-between py-1">
              <span className="font-semibold text-xs">Subtotal:</span>
              <span className="font-mono text-xs">RD$ {parseFloat(reception.grossAmount).toFixed(2)}</span>
            </div>
            {parseFloat(reception.discountPercentTotal) > 0 && (
              <div className="flex justify-between py-1 text-red-600">
                <span className="font-semibold text-xs">Discount ({parseFloat(reception.discountPercentTotal).toFixed(2)}%):</span>
                <span className="font-mono text-xs">
                  -RD$ {(parseFloat(reception.grossAmount) - parseFloat(reception.netAmount)).toFixed(2)}
                </span>
              </div>
            )}
            <Separator className="my-1" />
            <div className="flex justify-between py-1 text-base font-bold">
              <span>Total Amount:</span>
              <span className="font-mono text-green-600">
                RD$ {parseFloat(reception.netAmount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t text-center text-gray-600">
        <p className="text-xs">Thank you for your business!</p>
        <p className="text-xs mt-1">
          Generated: {format(new Date(), "PPP")} at {format(new Date(), "pp")}
        </p>
        <p className="text-xs mt-2">
          Sistema de Recepción de Frutos - Cash POS System
        </p>
      </div>
    </div>
  );
}