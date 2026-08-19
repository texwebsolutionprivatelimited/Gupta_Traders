
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

// const purchaseData = [
//   {
//     id: "PUR-001",
//     date: "15 Aug 2026",
//     supplier: "Shree Traders",
//     invoice: "INV-2026-101",
//     items: 12,
//     subtotal: 45600,
//     gst: 8208,
//     total: 53808,
//     status: "Completed",
//     payment: "Paid",
//   },
//   {
//     id: "PUR-002",
//     date: "13 Aug 2026",
//     supplier: "BuildWell Suppliers",
//     invoice: "INV-2026-098",
//     items: 8,
//     subtotal: 32400,
//     gst: 5832,
//     total: 38232,
//     status: "Completed",
//     payment: "Paid",
//   },
//   {
//     id: "PUR-003",
//     date: "11 Aug 2026",
//     supplier: "Cement House",
//     invoice: "INV-2026-094",
//     items: 15,
//     subtotal: 67200,
//     gst: 12096,
//     total: 79296,
//     status: "Pending",
//     payment: "Pending",
//   },
//   {
//     id: "PUR-004",
//     date: "08 Aug 2026",
//     supplier: "Gupta Building Materials",
//     invoice: "INV-2026-087",
//     items: 10,
//     subtotal: 28900,
//     gst: 5202,
//     total: 34102,
//     status: "Completed",
//     payment: "Paid",
//   },
//   {
//     id: "PUR-005",
//     date: "05 Aug 2026",
//     supplier: "Shree Traders",
//     invoice: "INV-2026-081",
//     items: 6,
//     subtotal: 18500,
//     gst: 3330,
//     total: 21830,
//     status: "Returned",
//     payment: "Refunded",
//   },
//   {
//     id: "PUR-006",
//     date: "02 Aug 2026",
//     supplier: "Metro Hardware",
//     invoice: "INV-2026-074",
//     items: 18,
//     subtotal: 41200,
//     gst: 7416,
//     total: 48616,
//     status: "Completed",
//     payment: "Paid",
//   },
// ];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

function SearchIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-4.35-4.35m1.85-5.4a7.25 7.25 0 1 1-14.5 0 7.25 7.25 0 0 1 14.5 0Z"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 5h18M6 12h12m-8 7h4"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12s3.5-6 9.75-6 9.75 6 9.75 6-3.5 6-9.75 6-9.75-6-9.75-6Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16"
      />
    </svg>
  );
}

function PurchaseIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 4.5h18v15H3v-15Zm3 4h12M6 12h4m-4 3h7"
      />
    </svg>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Completed:
      "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
    Pending:
      "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
    Returned:
      "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status] || "bg-slate-500/10 text-slate-500"
        }`}
    >
      {status}
    </span>
  );
}

function PaymentBadge({ payment }) {
  const styles = {
    Paid:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    Pending:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    Refunded:
      "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[payment] || "bg-slate-500/10 text-slate-500"
        }`}
    >
      {payment}
    </span>
  );
}

export default function PurchaseHistory() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [selectedPurchase, setSelectedPurchase] = useState(null);


  const [purchaseData, setPurchaseData] = useState([]);

  useEffect(() => {
    const savedPurchases =
      JSON.parse(
        localStorage.getItem("purchaseHistory")
      ) || [];

    setPurchaseData(savedPurchases);
  }, []);

  const filteredPurchases = useMemo(() => {
    const query = search.trim().toLowerCase();

    return purchaseData.filter((purchase) => {
      const matchesSearch =
        !query ||
        (purchase.id || "").toLowerCase().includes(query) ||
        (purchase.supplier || "")
          .toLowerCase()
          .includes(query) ||
        (purchase.invoice || "")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        purchase.status === statusFilter;

      const matchesPayment =
        paymentFilter === "All" ||
        purchase.payment === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [purchaseData, search, statusFilter, paymentFilter]);

  const totalPurchaseAmount = filteredPurchases.reduce(
    (sum, purchase) => sum + purchase.total,
    0
  );

  const completedCount = filteredPurchases.filter(
    (purchase) => purchase.status === "Completed"
  ).length;

  const pendingCount = filteredPurchases.filter(
    (purchase) => purchase.status === "Pending"
  ).length;


const handleDownload = (purchase) => {
  if (!purchase) return;

  const items = Array.isArray(purchase.items)
    ? purchase.items
    : [];

  const itemsRows = items
    .map((item, index) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.purchasePrice) || 0;
      const gst = Number(item.gst) || 0;

      const amount = quantity * price;
      const gstAmount = (amount * gst) / 100;
      const total = amount + gstAmount;

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${item.product || "Product"}</td>
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

  const subtotal = Number(purchase.subtotal) || 0;
  const gstTotal = Number(purchase.gst) || 0;
  const grandTotal = Number(purchase.total) || 0;

  const invoiceHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>Purchase Invoice - ${purchase.invoice || purchase.id}</title>

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
        <h1>Gupta Traders</h1>
        <p>Purchase Management System</p>
        <p>Purchase Invoice</p>
      </div>

      <div class="invoice-title">
        <h2>INVOICE</h2>
        <p>
          <strong>Invoice:</strong>
          ${purchase.invoice || "-"}
        </p>
        <p>
          <strong>Purchase ID:</strong>
          ${purchase.id || "-"}
        </p>
        <p>
          <strong>Date:</strong>
          ${purchase.date || "-"}
        </p>
      </div>

    </div>

    <div class="info">

      <div class="info-box">
        <h3>Supplier</h3>
        <p>
          <strong>${purchase.supplier || "-"}</strong>
        </p>
      </div>

      <div class="info-box">
        <h3>Payment Details</h3>
        <p>
          <strong>Payment:</strong>
          ${purchase.payment || "-"}
        </p>

        <p>
          <strong>Status:</strong>
          ${purchase.status || "-"}
        </p>
      </div>

    </div>

    <table>

      <thead>
        <tr>
          <th>#</th>
          <th>Product</th>
          <th>Qty</th>
          <th>Price</th>
          <th>GST</th>
          <th>Amount</th>
          <th>GST Amount</th>
          <th>Total</th>
        </tr>
      </thead>

      <tbody>
        ${
          itemsRows ||
          `
          <tr>
            <td colspan="8" style="text-align:center;">
              No product details available
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
        <span>GST</span>
        <strong>₹${gstTotal.toFixed(2)}</strong>
      </div>

      <div class="summary-row summary-total">
        <span>Grand Total</span>
        <span>₹${grandTotal.toFixed(2)}</span>
      </div>

    </div>

    <div class="footer">
      <p>Thank you for doing business with Gupta Traders.</p>
      <p>This invoice was generated electronically.</p>
    </div>

  </div>

</body>
</html>
`;

  try {
    const blob = new Blob(
      [invoiceHTML],
      {
        type: "text/html;charset=utf-8",
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `${
      purchase.invoice ||
      purchase.id ||
      "purchase-invoice"
    }.html`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Invoice download failed:", error);

    alert("Unable to download invoice.");
  }
};


  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Link
                to="/purchase"
                className="transition hover:text-emerald-500"
              >
                Purchase
              </Link>
              <span>/</span>
              <span>Purchase History</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Purchase History
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              View and manage all your purchase transactions.
            </p>
          </div>

          <Link
            to="/purchase"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600"
          >
            <PurchaseIcon />
            New Purchase
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total Purchases
            </p>
            <p className="mt-2 text-2xl font-bold">
              {filteredPurchases.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Purchase Amount
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalPurchaseAmount)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Completed
            </p>
            <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
              {completedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Pending
            </p>
            <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
              {pendingCount}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <SearchIcon />
              </div>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search purchase ID, supplier or invoice..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <FilterIcon />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800"
              >
                <option>All</option>
                <option>Completed</option>
                <option>Pending</option>
                <option>Returned</option>
              </select>
            </div>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800"
            >
              <option>All</option>
              <option>Paid</option>
              <option>Pending</option>
              <option>Refunded</option>
            </select>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70 md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Purchase
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Date
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Supplier
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Invoice
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                    Items
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                    Total
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                    Payment
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPurchases.map((purchase) => (
                  <tr
                    key={purchase.id}
                    className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-4">
                      <span className="font-semibold">{purchase.id}</span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {purchase.date}
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-sm font-medium">
                        {purchase.supplier}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {purchase.invoice}
                    </td>

                    <td className="px-5 py-4 text-center text-sm">
                      {purchase.itemCount ||
                        purchase.items?.length ||
                        0}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold">
                      {formatCurrency(purchase.total)}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <PaymentBadge payment={purchase.payment} />
                    </td>

                    <td className="px-5 py-4 text-center">
                      <StatusBadge status={purchase.status} />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedPurchase(purchase)}
                          title="View Purchase"
                          className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500 dark:border-slate-700"
                        >
                          <EyeIcon />
                        </button>

                        <button
                          onClick={() => handleDownload(purchase)}
                          title="Download Invoice"
                          className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-500 dark:border-slate-700"
                        >
                          <DownloadIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPurchases.length === 0 && (
            <div className="px-6 py-16 text-center">
              <p className="font-semibold">No purchases found</p>
              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filters.
              </p>
            </div>
          )}
        </div>

        {/* Mobile Cards */}
        <div className="space-y-4 md:hidden">
          {filteredPurchases.map((purchase) => (
            <div
              key={purchase.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{purchase.id}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {purchase.date}
                  </p>
                </div>

                <StatusBadge status={purchase.status} />
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Supplier</span>
                  <span className="text-right font-medium">
                    {purchase.supplier}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Invoice</span>
                  <span>{purchase.invoice}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Items</span>
                  <span>
                    {Array.isArray(purchase.items)
                      ? purchase.items.length
                      : purchase.items}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Payment</span>
                  <PaymentBadge payment={purchase.payment} />
                </div>

                <div className="flex justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(purchase.total)}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setSelectedPurchase(purchase)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-medium dark:border-slate-700"
                >
                  <EyeIcon />
                  View
                </button>

                <button
                  onClick={() => handleDownload(purchase)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-medium text-white hover:bg-emerald-600"
                >
                  <DownloadIcon />
                  Invoice
                </button>
              </div>
            </div>
          ))}

          {filteredPurchases.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <p className="font-semibold">No purchases found</p>
              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filters.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Purchase Details Modal */}
      {selectedPurchase && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPurchase(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Purchase ID</p>
                <h2 className="text-2xl font-bold">
                  {selectedPurchase.id}
                </h2>
              </div>

              <button
                onClick={() => setSelectedPurchase(null)}
                className="rounded-lg p-2 text-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                <p className="text-xs text-slate-500">Supplier</p>
                <p className="mt-1 font-semibold">
                  {selectedPurchase.supplier}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                <p className="text-xs text-slate-500">Invoice</p>
                <p className="mt-1 font-semibold">
                  {selectedPurchase.invoice}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                <p className="text-xs text-slate-500">Purchase Date</p>
                <p className="mt-1 font-semibold">
                  {selectedPurchase.date}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                <p className="mb-3 text-xs text-slate-500">
                  Products
                </p>

                <div className="space-y-2">
                  {Array.isArray(selectedPurchase.items) &&
                    selectedPurchase.items.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
                      >
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {item.product}
                          </p>

                          <p className="text-xs text-slate-500">
                            ₹{item.purchasePrice}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold">
                            Qty: {item.quantity}
                          </p>

                          <p className="text-xs text-slate-500">
                            GST: {item.gst}%
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span>{formatCurrency(selectedPurchase.subtotal)}</span>
              </div>

              <div className="mt-2 flex justify-between text-sm">
                <span className="text-slate-500">GST</span>
                <span>{formatCurrency(selectedPurchase.gst)}</span>
              </div>

              <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 font-bold dark:border-slate-700">
                <span>Total</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(selectedPurchase.total)}
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div className="flex gap-2">
                <StatusBadge status={selectedPurchase.status} />
                <PaymentBadge payment={selectedPurchase.payment} />
              </div>

              <button
                onClick={() => handleDownload(selectedPurchase)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                <DownloadIcon />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

