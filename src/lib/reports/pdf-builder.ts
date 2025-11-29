import { chromium } from '@playwright/test';
import type { PDFOptions } from './types';

export class PDFBuilder {
  /**
   * Generate PDF from HTML content using Playwright
   */
  static async generate(options: PDFOptions): Promise<Buffer> {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Set content
    await page.setContent(options.htmlContent, {
      waitUntil: 'networkidle',
    });

    // Generate PDF
    const pdf = await page.pdf({
      format: options.format || 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm',
      },
    });

    await browser.close();

    return Buffer.from(pdf);
  }

  /**
   * Helper: Wrap content in HTML document with styles
   */
  static wrapHTML(content: string, title: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Arial', sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #333;
    }
    h1 { font-size: 24pt; margin-bottom: 0.5em; text-align: center; }
    h2 { font-size: 18pt; margin-top: 1em; margin-bottom: 0.5em; border-bottom: 2px solid #333; padding-bottom: 0.25em; }
    h3 { font-size: 14pt; margin-top: 0.75em; margin-bottom: 0.25em; }
    p { margin: 0.5em 0; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f4f4f4;
      font-weight: bold;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-bold { font-weight: bold; }
    .text-green { color: #16a34a; }
    .text-red { color: #dc2626; }
    .text-gray { color: #666; }
    .mt-2 { margin-top: 2em; }
    .mb-2 { margin-bottom: 2em; }
    .info-table td { border: none; padding: 0.5em 1em; }
    .info-table td:first-child { font-weight: 500; color: #666; width: 40%; }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>
    `;
  }
}
