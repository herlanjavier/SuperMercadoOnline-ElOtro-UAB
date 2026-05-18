import PDFDocument from 'pdfkit';

const money = (value) => `Bs ${Number(value || 0).toFixed(2)}`;

const setPdfHeaders = (res, filename) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
};

const addHeader = (doc, title) => {
  doc.fontSize(18).text(title, { align: 'center' });
  doc.fontSize(11).text('Supermercado Online El Otro', { align: 'center' });
  doc.moveDown();
};

const addFooter = (doc, text) => {
  doc.moveDown();
  doc.fontSize(9).text(text, { align: 'center' });
};

const ensureSpace = (doc, height = 60) => {
  if (doc.y + height > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
};

const line = (doc, text) => {
  ensureSpace(doc, 18);
  doc.fontSize(10).text(text);
};

export const createSalesReportPdf = (report, res) => {
  setPdfHeaders(res, `sales-report-${report.period.label}.pdf`);
  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);

  addHeader(doc, 'Reporte de Ventas');
  line(doc, `Generado: ${new Date(report.generatedAt).toLocaleString()}`);
  line(doc, `Periodo: ${report.period.label}`);
  line(doc, `Total de ventas: ${report.summary.totalSalesCount}`);
  line(doc, `Total de ingresos: ${money(report.summary.totalRevenue)}`);
  doc.moveDown();

  for (const sale of report.sales) {
    ensureSpace(doc, 80);
    doc.fontSize(11).text(`${sale.receiptNumber} | ${new Date(sale.soldAt).toLocaleString()} | ${money(sale.total)}`);
    doc.fontSize(9).text(`Cliente: ${sale.customer?.firstName || ''} ${sale.customer?.lastName || ''}`);
    for (const item of sale.items) {
      line(doc, `  - ${item.productName}: ${item.quantity} x ${money(item.unitPrice)} = ${money(item.subtotal)}`);
    }
    doc.moveDown(0.5);
  }

  addFooter(doc, 'Reporte generado automaticamente. No valido como factura.');
  doc.end();
};

export const createInventoryReportPdf = (report, res) => {
  setPdfHeaders(res, `inventory-report-${report.generatedAt.slice(0, 10)}.pdf`);
  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);

  addHeader(doc, 'Reporte de Inventario');
  line(doc, `Generado: ${new Date(report.generatedAt).toLocaleString()}`);
  line(doc, `Total de productos: ${report.summary.totalProducts}`);
  line(doc, `Stock total actual: ${report.summary.totalCurrentStock}`);
  line(doc, `Valor aproximado: ${money(report.summary.totalInventoryValue)}`);
  line(doc, `Sin stock: ${report.summary.outOfStockProducts}`);
  line(doc, `Stock critico: ${report.summary.criticalStockProducts}`);
  line(doc, `Stock bajo: ${report.summary.lowStockProducts}`);
  doc.moveDown();

  doc.fontSize(12).text('Productos');
  for (const product of report.products) {
    line(doc, `${product.name} | ${product.stockStatus} | Stock: ${product.stock} | Precio: ${money(product.price)}`);
  }

  doc.moveDown();
  doc.fontSize(12).text('Ultimas entradas de inventario');
  for (const entry of report.inventoryEntries) {
    line(doc, `${new Date(entry.receivedAt).toLocaleString()} | ${entry.product?.name || 'Producto'} | Cantidad: ${entry.quantityReceived}`);
  }

  addFooter(doc, 'Reporte generado automaticamente.');
  doc.end();
};

export const createReceiptPdf = (receipt, res) => {
  setPdfHeaders(res, `receipt-${receipt.receiptNumber}.pdf`);
  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);

  addHeader(doc, receipt.title);
  line(doc, receipt.note);
  line(doc, `Recibo: ${receipt.receiptNumber}`);
  line(doc, `Fecha: ${new Date(receipt.soldAt).toLocaleString()}`);
  line(doc, `Cliente: ${receipt.customer?.firstName || ''} ${receipt.customer?.lastName || ''}`);
  line(doc, `CI: ${receipt.customer?.ci || ''}`);
  doc.moveDown();

  for (const item of receipt.items) {
    line(doc, `${item.productName}: ${item.quantity} x ${money(item.unitPrice)} = ${money(item.subtotal)}`);
  }

  doc.moveDown();
  doc.fontSize(13).text(`Total: ${money(receipt.total)}`, { align: 'right' });
  addFooter(doc, 'No valido como factura.');
  doc.end();
};
