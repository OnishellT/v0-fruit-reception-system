import type { RenderOptions } from './types';

// Lazy import to avoid loading JSReport during module initialization
async function getJSReportInstance() {
    const { getJSReport } = await import('./instance');
    return getJSReport();
}

export async function renderReport(options: RenderOptions): Promise<Buffer> {
    try {
        const jsreport = await getJSReportInstance();

        const result = await jsreport.render({
            template: {
                name: options.template,
            },
            data: options.data,
        });

        return result.content;
    } catch (error) {
        console.error('JSReport render error:', error);
        throw new Error(`Failed to render report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function renderCashReceiptPDF(data: any): Promise<Buffer> {
    return renderReport({
        template: 'cash-receipt',
        data,
        recipe: 'chrome-pdf',
    });
}

export async function renderReceptionReceiptPDF(data: any): Promise<Buffer> {
    return renderReport({
        template: 'reception-receipt',
        data,
        recipe: 'chrome-pdf',
    });
}

export async function renderDailySummaryExcel(data: any): Promise<Buffer> {
    return renderReport({
        template: 'daily-summary-excel',
        data,
        recipe: 'xlsx',
    });
}

export async function renderDailySummaryPDF(data: any): Promise<Buffer> {
    return renderReport({
        template: 'daily-summary-pdf',
        data,
        recipe: 'chrome-pdf',
    });
}
