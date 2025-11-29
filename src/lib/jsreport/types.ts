export interface JSReportTemplate {
    name: string;
    engine: 'handlebars';
    recipe: 'chrome-pdf' | 'xlsx' | 'html';
    content: string;
    helpers?: string;
}

export interface RenderOptions {
    template: string;
    data: any;
    recipe?: 'chrome-pdf' | 'xlsx';
}

export interface CashReceiptData {
    reception: {
        id: number;
        customerName: string;
        customerNationalId: string;
        fruitTypeName: string;
        receptionDate: string;
        containersCount: number;
        totalWeightKgOriginal: number;
        totalWeightKgFinal: number;
        discountWeightKg: number;
        discountPercentTotal: number;
        pricePerKgSnapshot: number;
        grossAmount: number;
        netAmount: number;
        qualityMetrics?: {
            humedad?: number;
            moho?: number;
            violetas?: number;
        };
        discountBreakdown?: Array<{
            parametro: string;
            valor: number;
            umbral: number;
            porcentajeDescuento: number;
            pesoDescuento: number;
        }>;
    };
    metadata: {
        generatedAt: string;
        generatedBy: string;
    };
}

export interface DailySummaryReception {
    id: number;
    customer: string;
    fruitType: string;
    weight: number;
    revenue: number;
    date: string;
}

export interface DailySummaryData {
    date: string;
    receptions: DailySummaryReception[];
    totals: {
        count: number;
        totalWeight: number;
        totalRevenue: number;
    };
    metadata: {
        generatedAt: string;
        generatedBy: string;
    };
}
