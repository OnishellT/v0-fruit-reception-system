export interface ReportData {
    title: string;
    generatedAt: Date;
    generatedBy: string;
    data: any;
}

export interface ExcelSheet {
    name: string;
    data: any[][];
    headers?: string[];
    columnWidths?: number[];
}

export interface ExcelOptions {
    filename: string;
    sheets: ExcelSheet[];
    author?: string;
    compression?: boolean;
}

export interface PDFOptions {
    filename: string;
    title: string;
    htmlContent: string;
    format?: 'A4' | 'Letter';
    orientation?: 'portrait' | 'landscape';
}

export type ReportFormat = 'excel' | 'pdf';
export type ReportType =
    | 'cash-receipt'
    | 'reception-detail'
    | 'daily-summary'
    | 'monthly-report';

// Cash Receipt Data
export interface CashReceiptData {
    id: number;
    customerName: string;
    customerNationalId: string;
    fruitTypeName: string;
    receptionDate: Date;
    containersCount: number;
    totalWeightKgOriginal: string | number;
    totalWeightKgFinal: string | number;
    discountWeightKg: string | number;
    discountPercentTotal: string | number;
    pricePerKgSnapshot: string | number;
    grossAmount: string | number;
    netAmount: string | number;
    calidadHumedad?: string | number | null;
    calidadMoho?: string | number | null;
    calidadVioletas?: string | number | null;
    discountBreakdown: Record<string, any>;
    createdAt: Date;
    createdBy: string;
}

// Daily Summary Data
export interface DailySummaryReception {
    id: number;
    customer: string;
    fruitType: string;
    weight: number;
    revenue: number;
}

export interface DailySummaryData {
    date: string;
    receptions: DailySummaryReception[];
    totals: {
        count: number;
        totalWeight: number;
        totalRevenue: number;
    };
}
