export function generatePurchaseReturnReceiptHTML(returnRecord) {
  if (!returnRecord) return '';

  const items = Array.isArray(returnRecord.items) ? returnRecord.items : [];

  const itemsRows = items
    .map((item, index) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.purchasePrice || item.unit_price || item.price) || 0;
      const gst = Number(item.gst ?? item.tax_rate ?? item.gstRate) || 0;

      const amount = quantity * price;
      const gstAmount = (amount * gst) / 100;
      const total = Number(item.total) || (amount + gstAmount);

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${item.product || item.product_name || item.name || "Product"}</td>
          <td>${quantity}</td>
          <td>₹${price.toFixed(2)}</td>
          <td>${gst}%</td>
          <td>₹${amount.toFixed(2)}</td>
          <td>₹${gstAmount.toFixed(2)}</td>
          <td>₹${total.toFixed(2)}</td>
        </tr>
      `;
    })
    .join("");

  const subtotal = Number(returnRecord.subtotal) ||
    items.reduce((sum, it) => sum + (Number(it.quantity || 0) * Number(it.purchasePrice || it.unit_price || it.price || 0)), 0);

  const gstTotal = Number(returnRecord.tax_amount || returnRecord.taxAmount || returnRecord.gst) ||
    items.reduce((sum, it) => {
      const amt = Number(it.quantity || 0) * Number(it.purchasePrice || it.unit_price || it.price || 0);
      const rate = Number(it.gst ?? it.tax_rate ?? 0);
      return sum + ((amt * rate) / 100);
    }, 0);

  const grandTotal = Number(returnRecord.total_amount || returnRecord.totalAmount || returnRecord.total) || (subtotal + gstTotal);

  const returnNo = returnRecord.returnNo || returnRecord.return_number || returnRecord.id || "PR-000";
  const originalInvoice = returnRecord.invoiceNo || returnRecord.purchase_invoice || returnRecord.purchase?.invoice_number || returnRecord.invoice || "-";

  const rawDate = returnRecord.date || returnRecord.return_date || returnRecord.created_at;
  const dateStr = rawDate
    ? new Date(rawDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    })
    : "-";

  const supplierName = returnRecord.supplierName || returnRecord.supplier?.company_name || returnRecord.supplier || "-";
  const supplierContact = returnRecord.supplierContact || returnRecord.supplier?.phone || returnRecord.supplier?.contact_person || "";
  const reason = returnRecord.reason || "Supplier Return";
  const notes = returnRecord.notes || "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>Purchase Return - ${returnNo}</title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 30px;
      font-family: Arial, Helvetica, sans-serif;
      color: #0f172a;
      background: #ffffff;
    }

    .invoice {
      max-width: 1000px;
      margin: auto;
      border: 1px solid #e2e8f0;
      padding: 35px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #10b981;
      padding-bottom: 20px;
      margin-bottom: 25px;
    }

    .company h1 {
      margin: 0;
      font-size: 28px;
      color: #059669;
    }

    .company p {
      margin: 5px 0;
      color: #64748b;
      font-size: 14px;
    }

    .invoice-title {
      text-align: right;
    }

    .invoice-title h2 {
      margin: 0 0 8px;
      font-size: 24px;
      color: #0f172a;
    }

    .invoice-title p {
      margin: 4px 0;
      font-size: 14px;
      color: #475569;
    }

    .info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 25px;
    }

    .info-box {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
      background: #f8fafc;
    }

    .info-box h3 {
      margin: 0 0 8px;
      font-size: 13px;
      color: #64748b;
      text-transform: uppercase;
    }

    .info-box p {
      margin: 4px 0;
      font-size: 14px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }

    th {
      background: #f1f5f9;
      color: #334155;
      font-size: 12px;
      text-transform: uppercase;
      padding: 12px 8px;
      border: 1px solid #e2e8f0;
      text-align: left;
    }

    td {
      padding: 12px 8px;
      border: 1px solid #e2e8f0;
      font-size: 13px;
    }

    .summary {
      width: 350px;
      margin-left: auto;
      margin-top: 25px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }

    .summary-total {
      border-top: 2px solid #0f172a;
      margin-top: 8px;
      padding-top: 12px;
      font-size: 18px;
      font-weight: bold;
      color: #059669;
    }

    .footer {
      margin-top: 40px;
      padding-top: 15px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }

    @media print {
      body {
        padding: 0;
      }

      .invoice {
        border: none;
      }
    }
  </style>
</head>

<body>

  <div class="invoice">

    <div class="header">

      <div class="company">
        <h1>GUPTA TRADERS & SUPERSTORE</h1>
        <p>Plot no. 12 Balaji Nagar, Narela Shankari, Near khedapati Mandir, Bhopal MP(462022)</p>
        <p style="font-weight: bold; color: #000000;">Mob.no: +91 9131822789</p>
        <p>Purchase Return Voucher</p>
      </div>

      <div class="invoice-title">
        <h2>PURCHASE RETURN</h2>
        <p>
          <strong>Return No:</strong>
          ${returnNo}
        </p>
        <p>
          <strong>Original Invoice:</strong>
          ${originalInvoice}
        </p>
        <p>
          <strong>Return Date:</strong>
          ${dateStr}
        </p>
      </div>

    </div>

    <div class="info">

      <div class="info-box">
        <h3>Supplier Information</h3>
        <p>
          <strong>${supplierName}</strong>
        </p>
        ${supplierContact ? `<p><strong>Contact:</strong> ${supplierContact}</p>` : ''}
      </div>

      <div class="info-box">
        <h3>Return Details</h3>
        <p>
          <strong>Reason:</strong>
          ${reason}
        </p>
        <p>
          <strong>Status:</strong>
          Completed (Refunded)
        </p>
        ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
      </div>

    </div>

    <table>

      <thead>
        <tr>
          <th>#</th>
          <th>Returned Product</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>GST</th>
          <th>Amount</th>
          <th>GST Amount</th>
          <th>Total</th>
        </tr>
      </thead>

      <tbody>
        ${itemsRows ||
    `
          <tr>
            <td colspan="8" style="text-align:center;">
              No returned product details available
            </td>
          </tr>
          `
    }
      </tbody>

    </table>

    <div class="summary">

      <div class="summary-row">
        <span>Subtotal</span>
        <strong>₹${subtotal.toFixed(2)}</strong>
      </div>

      <div class="summary-row">
        <span>GST Refund</span>
        <strong>₹${gstTotal.toFixed(2)}</strong>
      </div>

      <div class="summary-row summary-total">
        <span>Total Return Amount</span>
        <span>₹${grandTotal.toFixed(2)}</span>
      </div>

    </div>

    <div class="footer">
      <p>Thank you for doing business with GUPTA TRADERS & SUPERSTORE.</p>
      <p>This purchase return voucher was generated electronically and adjusts inventory records.</p>
    </div>

  </div>

</body>
</html>
`;
}

export function downloadPurchaseReturnReceipt(returnRecord) {
  if (!returnRecord) return;
  const html = generatePurchaseReturnReceiptHTML(returnRecord);
  const returnNo = returnRecord.returnNo || returnRecord.return_number || returnRecord.id || "purchase-return";

  try {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${returnNo}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Purchase return download failed:", error);
    alert("Unable to download purchase return receipt.");
  }
}

/**
 * Print Purchase Return Receipt via browser print dialog
 */
export function printPurchaseReturnReceipt(returnRecord) {
  if (!returnRecord) return;
  const html = generatePurchaseReturnReceiptHTML(returnRecord);

  try {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 300);
    }
  } catch (e) {
    console.warn("Silent iframe print failed, falling back to window.open", e);
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 300);
    }
  }
}
