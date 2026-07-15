import { jsPDF } from "jspdf";

export function generateInvoicePdfBuffer(invoice: {
  invoice_no: string;
  client_name: string;
  client_code: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  items: Array<{
    item_type: string;
    description: string;
    unit_price: number;
    quantity: number;
    total_price: number;
  }>;
  created_at: string;
}) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Header Design
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(37, 99, 235); // primary color
  doc.text("CLINIC CARE SYSTEM", 14, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139); // muted text
  doc.text("123 Health Ave, Clinic Suite 100", 14, 26);
  doc.text("Support Email: support@cliniccare.com", 14, 31);

  // Invoice Meta
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42); // dark heading
  doc.text(`INVOICE: #${invoice.invoice_no}`, 130, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 130, 26);
  doc.text(`Patient: ${invoice.client_name}`, 130, 31);
  doc.text(`MRN: ${invoice.client_code}`, 130, 36);

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 40, 196, 40);

  // Billing Items Table Header
  doc.setFillColor(248, 250, 252);
  doc.rect(14, 46, 182, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("Type", 16, 51);
  doc.text("Description", 45, 51);
  doc.text("Qty", 125, 51);
  doc.text("Unit Price", 145, 51);
  doc.text("Total", 175, 51);

  // Items rows
  let currentY = 60;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);

  invoice.items.forEach((item) => {
    doc.text(item.item_type, 16, currentY);
    
    // Auto-wrap description if too long
    const descText = doc.splitTextToSize(item.description, 75);
    doc.text(descText, 45, currentY);
    
    doc.text(String(item.quantity), 127, currentY);
    doc.text(`$${Number(item.unit_price).toFixed(2)}`, 145, currentY);
    doc.text(`$${Number(item.total_price).toFixed(2)}`, 175, currentY);
    
    currentY += descText.length * 5 + 3;
  });

  // Totals Section
  currentY += 5;
  doc.line(14, currentY, 196, currentY);
  currentY += 8;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Subtotal:", 135, currentY);
  doc.setTextColor(15, 23, 42);
  doc.text(`$${Number(invoice.subtotal).toFixed(2)}`, 175, currentY);

  if (Number(invoice.discount) > 0) {
    currentY += 6;
    doc.setTextColor(100, 116, 139);
    doc.text("Discount:", 135, currentY);
    doc.setTextColor(16, 185, 129); // green
    doc.text(`-$${Number(invoice.discount).toFixed(2)}`, 175, currentY);
  }

  currentY += 6;
  doc.setTextColor(100, 116, 139);
  doc.text("Tax:", 135, currentY);
  doc.setTextColor(15, 23, 42);
  doc.text(`$${Number(invoice.tax).toFixed(2)}`, 175, currentY);

  currentY += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Total Amount:", 135, currentY);
  doc.text(`$${Number(invoice.total).toFixed(2)}`, 175, currentY);

  // Footer message
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("Thank you for choosing Clinic Care System. Wish you a healthy recovery!", 14, 280);

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
