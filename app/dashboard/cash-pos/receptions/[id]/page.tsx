"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Printer, Download, FileText, Calculator, Scale, DollarSign } from "lucide-react";
import { getCashReception } from "@/lib/actions/cash/receptions";
import { InvoiceViewer } from "@/components/cash-pos/invoice-viewer";
import { DiscountBreakdown } from "@/components/cash-pos/discount-breakdown";
import { generateInvoicePDF } from "@/lib/utils/pdf-generator";
import { toast } from "sonner";
import { format } from "date-fns";

interface ReceptionDetails {
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
}

export default function ViewReceptionPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);

  const [reception, setReception] = useState<ReceptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    loadReception();
  }, [id]);

  const loadReception = async () => {
    try {
      setLoading(true);
      const result = await getCashReception(id);

      if (result.success && result.data) {
        setReception(result.data);
      } else {
        toast.error(result.error || "Failed to load reception details");
        router.push("/dashboard/cash-pos/receptions");
      }
    } catch (error) {
      console.error("Error loading reception:", error);
      toast.error("Failed to load reception details");
      router.push("/dashboard/cash-pos/receptions");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // Hide non-printable elements
    const modal = document.querySelector('[class*="fixed inset-0"]');
    if (modal) {
      modal.classList.add('no-print');
    }

    // Trigger print
    window.print();

    // Restore elements after print dialog
    setTimeout(() => {
      if (modal) {
        modal.classList.remove('no-print');
      }
    }, 100);
  };

  const handleDownload = async () => {
    if (!reception) return;

    try {
      toast.info("Generating PDF...");
      await generateInvoicePDF(reception);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading reception details...</p>
        </div>
      </div>
    );
  }

  if (!reception) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Reception not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard/cash-pos/receptions")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Receptions
            </Button>
            <h1 className="text-3xl font-bold">Reception #{reception.id}</h1>
            <p className="text-muted-foreground mt-2">
              {reception.fruitType.name} reception for {reception.customer.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print Invoice
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Reception Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Reception Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reception Date</label>
                  <p className="text-lg">{format(new Date(reception.receptionDate), "PPP")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created By</label>
                  <p className="text-lg">{reception.createdBy}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fruit Type</label>
                  <p className="text-lg">{reception.fruitType.name} ({reception.fruitType.code})</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Customer</label>
                  <p className="text-lg">{reception.customer.name}</p>
                  <p className="text-sm text-muted-foreground">{reception.customer.nationalId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Containers</label>
                  <p className="text-lg">{reception.containersCount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created At</label>
                  <p className="text-lg">{format(new Date(reception.createdAt), "PPp")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weight & Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5" />
                Weight & Pricing Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Original Weight</TableCell>
                    <TableCell className="text-right font-mono">
                      {parseFloat(reception.totalWeightKgOriginal).toFixed(3)} kg
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Discount Weight</TableCell>
                    <TableCell className="text-right font-mono text-red-600">
                      -{parseFloat(reception.discountWeightKg).toFixed(3)} kg
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Final Weight</TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {parseFloat(reception.totalWeightKgFinal).toFixed(3)} kg
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Price per Kg</TableCell>
                    <TableCell className="text-right font-mono">
                      RD$ {parseFloat(reception.pricePerKgSnapshot).toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Gross Amount</TableCell>
                    <TableCell className="text-right font-mono">
                      RD$ {parseFloat(reception.grossAmount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Net Amount</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-green-600">
                      RD$ {parseFloat(reception.netAmount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Quality Metrics */}
          {(reception.calidadHumedad || reception.calidadMoho || reception.calidadVioletas) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Quality Metrics
                </CardTitle>
                <CardDescription>
                  Quality assessment results used for discount calculations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {reception.calidadHumedad && (
                    <div className="text-center">
                      <label className="text-sm font-medium text-muted-foreground">Humidity</label>
                      <p className="text-2xl font-bold">{parseFloat(reception.calidadHumedad).toFixed(1)}%</p>
                    </div>
                  )}
                  {reception.calidadMoho && (
                    <div className="text-center">
                      <label className="text-sm font-medium text-muted-foreground">Mold</label>
                      <p className="text-2xl font-bold">{parseFloat(reception.calidadMoho).toFixed(1)}%</p>
                    </div>
                  )}
                  {reception.calidadVioletas && (
                    <div className="text-center">
                      <label className="text-sm font-medium text-muted-foreground">Violetas</label>
                      <p className="text-2xl font-bold">{parseFloat(reception.calidadVioletas).toFixed(1)}%</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Discount</span>
                  <span className="font-semibold text-red-600">
                    {parseFloat(reception.discountPercentTotal).toFixed(2)}%
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Final Amount</span>
                  <span className="text-green-600">
                    RD$ {parseFloat(reception.netAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

           {/* Discount Breakdown */}
           <DiscountBreakdown
             discountBreakdown={reception.discountBreakdown}
             discountPercentTotal={parseFloat(reception.discountPercentTotal)}
             discountWeightKg={reception.discountWeightKg}
           />

          {/* Invoice Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={() => setShowInvoice(true)} className="w-full">
                <FileText className="w-4 h-4 mr-2" />
                View Invoice
              </Button>
              <Button variant="outline" onClick={handlePrint} className="w-full">
                <Printer className="w-4 h-4 mr-2" />
                Print Invoice
              </Button>
              <Button variant="outline" onClick={handleDownload} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Invoice #{reception.id}</h2>
                <Button variant="ghost" onClick={() => setShowInvoice(false)}>
                  ✕
                </Button>
              </div>
              <InvoiceViewer reception={reception} />
            </div>
          </div>
        </div>
      )}

      {/* Print-only Invoice */}
      {showInvoice && (
        <div className="print-only hidden">
          <InvoiceViewer reception={reception} />
        </div>
      )}
    </div>
  );
}