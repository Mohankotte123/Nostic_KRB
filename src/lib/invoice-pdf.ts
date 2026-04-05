import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { InvoicePayload } from "@/types/invoice";

function formatInr(n: number): string {
  return `INR ${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type DocWithTable = jsPDF & { lastAutoTable?: { finalY: number } };

/**
 * Builds a printable A4 tax invoice / receipt as PDF (ASCII-safe for core fonts).
 */
export function buildInvoicePdf(payload: InvoicePayload): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = margin;
  const f = payload.franchise;

  doc.setFillColor(16, 185, 129);
  doc.rect(margin, y, pageW - 2 * margin, 1.2, "F");
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(f.tradingName, margin, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  if (f.legalName) {
    doc.text(f.legalName, margin, y);
    y += 5;
  }
  if (f.tagline) {
    doc.setTextColor(16, 185, 129);
    doc.text(f.tagline, margin, y);
    y += 5;
    doc.setTextColor(71, 85, 105);
  }
  for (const line of f.addressLines) {
    doc.text(line, margin, y);
    y += 4.5;
  }
  y += 2;

  const gstLine = f.gstin
    ? `GSTIN: ${f.gstin}`
    : "Tax invoice / bill of supply as applicable";
  doc.setFontSize(8);
  doc.text(gstLine, margin, y);
  y += 4;
  const contact: string[] = [];
  if (f.phone) contact.push(`Phone: ${f.phone}`);
  if (f.email) contact.push(`Email: ${f.email}`);
  if (contact.length) {
    doc.text(contact.join("   "), margin, y);
    y += 4;
  }

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(99, 102, 241);
  doc.text(
    payload.isDraft ? "DRAFT QUOTATION" : "TAX INVOICE / RECEIPT",
    margin,
    y,
  );
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  const meta: string[][] = [];
  if (payload.isDraft) {
    meta.push(["Status", "DRAFT - not a completed sale"]);
  }
  meta.push(["Order ID", payload.orderId]);
  meta.push(["Date & time", formatWhen(payload.soldAtIso)]);
  meta.push(["Payment", payload.paymentMethod]);
  if (f.storeCode) meta.push(["Store code", f.storeCode]);

  autoTable(doc, {
    startY: y,
    body: meta,
    theme: "plain",
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 1.5, textColor: [15, 23, 42] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 36, textColor: [100, 116, 139] },
      1: { cellWidth: pageW - 2 * margin - 36 },
    },
  });

  const d = doc as DocWithTable;
  y = (d.lastAutoTable?.finalY ?? y) + 6;

  autoTable(doc, {
    startY: y,
    head: [["#", "Item", "Qty", "Rate", "Amount"]],
    body: payload.lines.map((l, i) => [
      String(i + 1),
      l.name,
      String(l.qty),
      formatInr(l.unitPrice),
      formatInr(l.lineTotal),
    ]),
    styles: {
      fontSize: 9,
      cellPadding: 2,
      textColor: [15, 23, 42],
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [51, 65, 85],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 62 },
      2: { cellWidth: 14, halign: "center" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
    margin: { left: margin, right: margin },
  });

  const finalY = (d.lastAutoTable?.finalY ?? y) + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Total payable: ${formatInr(payload.totalAmount)}`, pageW - margin, finalY, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Thank you for choosing ${f.tradingName}.`,
    pageW / 2,
    finalY + 12,
    { align: "center" },
  );

  return doc;
}

export function buildInvoicePdfBlob(payload: InvoicePayload): Blob {
  return buildInvoicePdf(payload).output("blob");
}

export function downloadInvoicePdf(payload: InvoicePayload): void {
  const safe = payload.orderId.replace(/[^a-zA-Z0-9-]/g, "_");
  buildInvoicePdf(payload).save(`${safe}-invoice.pdf`);
}

/**
 * Opens the system print dialog for the invoice using a hidden iframe (no extra tab).
 */
export function printInvoicePdf(payload: InvoicePayload): void {
  const blob = buildInvoicePdfBlob(payload);
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement("iframe");
  iframe.setAttribute(
    "style",
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none",
  );
  iframe.setAttribute("title", "Invoice print");
  iframe.src = url;
  document.body.appendChild(iframe);

  const cleanup = () => {
    URL.revokeObjectURL(url);
    iframe.remove();
  };

  let printed = false;
  const doPrintOnce = () => {
    if (printed) return;
    printed = true;
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      /* ignore */
    }
    setTimeout(cleanup, 2500);
  };

  iframe.onload = () => {
    setTimeout(doPrintOnce, 400);
  };

  setTimeout(doPrintOnce, 2000);
}
