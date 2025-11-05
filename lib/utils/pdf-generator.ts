import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generateInvoicePDF(reception: any): Promise<void> {
  try {
    // Create a temporary element with the invoice content
    const invoiceElement = document.createElement('div');
    invoiceElement.innerHTML = `
      <div style="max-width: 750px; margin: 0 auto; background: white; font-family: Arial, sans-serif; font-size: 9px; line-height: 1.2; color: #000;">
        <!-- Invoice Header -->
        <div style="border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h1 style="font-size: 24px; font-weight: bold; color: #000; margin: 0;">INVOICE</h1>
              <p style="color: #666; margin: 3px 0 0 0; font-size: 8px;">Fruit Reception Receipt</p>
            </div>
            <div style="text-align: right;">
              <h2 style="font-size: 16px; font-weight: bold; margin: 0;">#${reception.id.toString().padStart(6, '0')}</h2>
              <p style="color: #666; margin: 3px 0 0 0; font-size: 8px;">Date: ${new Date(reception.receptionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>

        <!-- Company Info -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
          <div>
            <h3 style="font-size: 12px; font-weight: bold; margin-bottom: 3px;">From:</h3>
            <div style="color: #333;">
              <p style="font-weight: bold; margin: 0; font-size: 10px;">Sistema de Recepción de Frutos</p>
              <p style="margin: 2px 0; font-size: 9px;">Fruit Processing Center</p>
              <p style="margin: 2px 0; font-size: 9px;">Cash POS System</p>
            </div>
          </div>
          <div>
            <h3 style="font-size: 12px; font-weight: bold; margin-bottom: 3px;">To:</h3>
            <div style="color: #333;">
              <p style="font-weight: bold; margin: 0; font-size: 10px;">${reception.customer.name}</p>
              <p style="margin: 2px 0; font-size: 9px;">ID: ${reception.customer.nationalId}</p>
            </div>
          </div>
        </div>

        <!-- Reception Details -->
        <div style="border: 1px solid #000; margin-bottom: 10px;">
          <div style="padding: 8px; border-bottom: 1px solid #000;">
            <h3 style="font-size: 12px; font-weight: bold; margin: 0;">Reception Details</h3>
          </div>
          <div style="padding: 8px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 8px;">
              <div>
                <label style="font-size: 8px; font-weight: bold; color: #666; display: block;">Fruit Type</label>
                <p style="font-weight: bold; margin: 2px 0 0 0; font-size: 10px;">${reception.fruitType.name}</p>
                <p style="font-size: 8px; color: #666; margin: 1px 0 0 0;">(${reception.fruitType.code})</p>
              </div>
              <div>
                <label style="font-size: 8px; font-weight: bold; color: #666; display: block;">Containers</label>
                <p style="font-weight: bold; margin: 2px 0 0 0; font-size: 10px;">${reception.containersCount}</p>
              </div>
              <div>
                <label style="font-size: 8px; font-weight: bold; color: #666; display: block;">Processed By</label>
                <p style="font-weight: bold; margin: 2px 0 0 0; font-size: 10px;">${reception.createdBy}</p>
              </div>
              <div>
                <label style="font-size: 8px; font-weight: bold; color: #666; display: block;">Status</label>
                <span style="background: #d1fae5; color: #065f46; padding: 1px 4px; border-radius: 2px; font-size: 8px; font-weight: bold;">Completed</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Weight & Pricing Table -->
        <div style="border: 1px solid #000; margin-bottom: 10px;">
          <div style="padding: 8px; border-bottom: 1px solid #000;">
            <h3 style="font-size: 12px; font-weight: bold; margin: 0;">Weight & Pricing Breakdown</h3>
          </div>
          <div style="padding: 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 1px solid #000;">
                  <th style="text-align: left; padding: 3px; font-weight: bold; font-size: 9px;">Description</th>
                  <th style="text-align: right; padding: 3px; font-weight: bold; font-size: 9px;">Weight (kg)</th>
                  <th style="text-align: right; padding: 3px; font-weight: bold; font-size: 9px;">Price/kg</th>
                  <th style="text-align: right; padding: 3px; font-weight: bold; font-size: 9px;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 3px; font-size: 9px;">Original Weight</td>
                  <td style="text-align: right; padding: 3px; font-family: monospace; font-size: 9px;">${parseFloat(reception.totalWeightKgOriginal).toFixed(3)}</td>
                  <td style="text-align: right; padding: 3px; font-family: monospace; font-size: 9px;">RD$ ${parseFloat(reception.pricePerKgSnapshot).toFixed(2)}</td>
                  <td style="text-align: right; padding: 3px; font-family: monospace; font-size: 9px;">RD$ ${parseFloat(reception.grossAmount).toFixed(2)}</td>
                </tr>
                ${parseFloat(reception.discountWeightKg) > 0 ? `
                <tr style="color: #dc2626;">
                  <td style="padding: 3px; font-size: 9px;">Quality Discount</td>
                  <td style="text-align: right; padding: 3px; font-family: monospace; font-size: 9px;">-${parseFloat(reception.discountWeightKg).toFixed(3)}</td>
                  <td style="text-align: right; padding: 3px; font-family: monospace; font-size: 9px;">RD$ ${parseFloat(reception.pricePerKgSnapshot).toFixed(2)}</td>
                  <td style="text-align: right; padding: 3px; font-family: monospace; font-size: 9px;">-RD$ ${(parseFloat(reception.discountWeightKg) * parseFloat(reception.pricePerKgSnapshot)).toFixed(2)}</td>
                </tr>
                ` : ''}
                <tr style="border-top: 2px solid #000; font-weight: bold;">
                  <td style="padding: 3px; font-size: 9px;">Final Weight</td>
                  <td style="text-align: right; padding: 3px; font-family: monospace; font-size: 9px;">${parseFloat(reception.totalWeightKgFinal).toFixed(3)}</td>
                  <td style="text-align: right; padding: 3px; font-family: monospace; font-size: 9px;">RD$ ${parseFloat(reception.pricePerKgSnapshot).toFixed(2)}</td>
                  <td style="text-align: right; padding: 3px; font-family: monospace; font-size: 9px;">RD$ ${parseFloat(reception.netAmount).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Quality Breakdown -->
        ${reception.discountBreakdown && Array.isArray(reception.discountBreakdown) && reception.discountBreakdown.length > 0 ? `
        <div style="border: 1px solid #000; margin-bottom: 10px;">
          <div style="padding: 8px; border-bottom: 1px solid #000;">
            <h3 style="font-size: 12px; font-weight: bold; margin: 0;">Quality Discount Breakdown</h3>
          </div>
          <div style="padding: 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 1px solid #000;">
                  <th style="text-align: left; padding: 3px; font-weight: bold; font-size: 8px;">Metric</th>
                  <th style="text-align: right; padding: 3px; font-weight: bold; font-size: 8px;">Threshold</th>
                  <th style="text-align: right; padding: 3px; font-weight: bold; font-size: 8px;">Actual</th>
                  <th style="text-align: right; padding: 3px; font-weight: bold; font-size: 8px;">Excess %</th>
                  <th style="text-align: right; padding: 3px; font-weight: bold; font-size: 8px;">Weight Loss (kg)</th>
                </tr>
              </thead>
              <tbody>
                ${reception.discountBreakdown.map((item: any) => `
                <tr>
                  <td style="padding: 3px; font-size: 8px;">${item.parametro.replace(' (Evaluación)', '')}</td>
                  <td style="text-align: right; padding: 3px; font-family: monospace; font-size: 8px;">${parseFloat(item.umbral).toFixed(1)}%</td>
                  <td style="text-align: right; padding: 3px; font-family: monospace; font-size: 8px;">${parseFloat(item.valor).toFixed(1)}%</td>
                  <td style="text-align: right; padding: 3px; font-family: monospace; font-size: 8px; color: #dc2626;">${parseFloat(item.porcentajeDescuento).toFixed(1)}%</td>
                  <td style="text-align: right; padding: 3px; font-family: monospace; font-size: 8px; color: #dc2626;">${parseFloat(item.pesoDescuento).toFixed(3)}</td>
                </tr>
                `).join('')}
                <tr style="border-top: 1px solid #000; font-weight: bold; background: #fef2f2;">
                  <td style="padding: 3px; font-size: 8px;" colspan="4">Total Quality Discount</td>
                  <td style="text-align: right; padding: 3px; font-family: monospace; font-size: 8px; color: #dc2626;">${parseFloat(reception.discountWeightKg).toFixed(3)} kg</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        ` : ''}

        <!-- Quality Metrics -->
        ${(reception.calidadHumedad || reception.calidadMoho || reception.calidadVioletas) ? `
        <div style="border: 1px solid #000; margin-bottom: 10px;">
          <div style="padding: 8px; border-bottom: 1px solid #000;">
            <h3 style="font-size: 12px; font-weight: bold; margin: 0;">Quality Assessment</h3>
          </div>
          <div style="padding: 8px;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
              ${reception.calidadHumedad ? `
              <div style="text-align: center; padding: 6px; background: #f9fafb; border-radius: 2px;">
                <label style="font-size: 8px; font-weight: bold; color: #666; display: block;">Humidity</label>
                <p style="font-size: 14px; font-weight: bold; margin: 3px 0 0 0;">${parseFloat(reception.calidadHumedad).toFixed(1)}%</p>
              </div>
              ` : ''}
              ${reception.calidadMoho ? `
              <div style="text-align: center; padding: 6px; background: #f9fafb; border-radius: 2px;">
                <label style="font-size: 8px; font-weight: bold; color: #666; display: block;">Mold</label>
                <p style="font-size: 14px; font-weight: bold; margin: 3px 0 0 0;">${parseFloat(reception.calidadMoho).toFixed(1)}%</p>
              </div>
              ` : ''}
              ${reception.calidadVioletas ? `
              <div style="text-align: center; padding: 6px; background: #f9fafb; border-radius: 2px;">
                <label style="font-size: 8px; font-weight: bold; color: #666; display: block;">Violetas</label>
                <p style="font-size: 14px; font-weight: bold; margin: 3px 0 0 0;">${parseFloat(reception.calidadVioletas).toFixed(1)}%</p>
              </div>
              ` : ''}
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Total Summary -->
        <div style="border-top: 2px solid #000; padding-top: 10px;">
          <div style="display: flex; justify-content: flex-end;">
            <div style="width: 180px;">
              <div style="display: flex; justify-content: space-between; padding: 3px 0;">
                <span style="font-weight: bold; font-size: 10px;">Subtotal:</span>
                <span style="font-family: monospace; font-size: 10px;">RD$ ${parseFloat(reception.grossAmount).toFixed(2)}</span>
              </div>
              ${parseFloat(reception.discountPercentTotal) > 0 ? `
              <div style="display: flex; justify-content: space-between; padding: 3px 0; color: #dc2626;">
                <span style="font-weight: bold; font-size: 10px;">Discount (${parseFloat(reception.discountPercentTotal).toFixed(2)}%):</span>
                <span style="font-family: monospace; font-size: 10px;">-RD$ ${(parseFloat(reception.grossAmount) - parseFloat(reception.netAmount)).toFixed(2)}</span>
              </div>
              ` : ''}
              <div style="border-top: 1px solid #000; margin: 3px 0;"></div>
              <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px; font-weight: bold;">
                <span>Total Amount:</span>
                <span style="font-family: monospace; color: #059669;">RD$ ${parseFloat(reception.netAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #000; text-align: center; color: #666;">
          <p style="margin: 0; font-size: 10px;">Thank you for your business!</p>
          <p style="font-size: 8px; margin: 3px 0 0 0;">
            Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p style="font-size: 7px; margin: 8px 0 0 0;">
            Sistema de Recepción de Frutos - Cash POS System
          </p>
        </div>
      </div>
    `;

    // Add to DOM temporarily
    invoiceElement.style.position = 'absolute';
    invoiceElement.style.left = '-9999px';
    invoiceElement.style.top = '-9999px';
    document.body.appendChild(invoiceElement);

    // Generate canvas from HTML
    const canvas = await html2canvas(invoiceElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 800,
      height: invoiceElement.scrollHeight,
    });

    // Remove temporary element
    document.body.removeChild(invoiceElement);

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Download PDF
    pdf.save(`invoice-${reception.id}.pdf`);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}