import * as XLSX from 'xlsx';
import type { ExcelOptions } from './types';

export class ExcelBuilder {
    /**
     * Generate Excel file from data
     */
    static async generate(options: ExcelOptions): Promise<Buffer> {
        const workbook = XLSX.utils.book_new();

        // Set metadata
        workbook.Props = {
            Title: options.filename,
            Author: options.author || 'Sistema de Recepción',
            CreatedDate: new Date(),
        };

        // Add sheets
        for (const sheet of options.sheets) {
            const worksheet = XLSX.utils.aoa_to_sheet([
                sheet.headers || [],
                ...sheet.data,
            ]);

            // Set column widths
            if (sheet.columnWidths) {
                worksheet['!cols'] = sheet.columnWidths.map(w => ({ wch: w }));
            }

            XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
        }

        // Generate buffer
        const buffer = XLSX.write(workbook, {
            type: 'buffer',
            bookType: 'xlsx',
            compression: options.compression ?? true,
        });

        return Buffer.from(buffer);
    }

    /**
     * Helper: Convert array of objects to 2D array
     */
    static objectsToArray<T extends Record<string, any>>(
        objects: T[],
        columns: (keyof T)[]
    ): any[][] {
        return objects.map(obj => columns.map(col => obj[col]));
    }
}
