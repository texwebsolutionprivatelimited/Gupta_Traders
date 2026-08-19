
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart,
  CalendarDays,
  Download,
  IndianRupee,
  Package,
  Truck,
  TrendingDown,
  ReceiptText,
} from "lucide-react";
import { useReport } from "../../context/ReportContext";

export default function PurchaseReport() {
  const { purchaseRecords = [] } = useReport();

  const [dateFilter, setDateFilter] = useState("All");

  const purchases = Array.isArray(purchaseRecords)
    ? purchaseRecords
    : [];

  const filteredPurchases = useMemo(() => {
    if (dateFilter === "All") {
      return purchases;
    }

    const today = new Date();
    const days = Number(dateFilter);

    return purchases.filter((purchase) => {
      if (!purchase.date) return false;

      const purchaseDate = new Date(purchase.date);

      const difference =
        (today - purchaseDate) /
        (1000 * 60 * 60 * 24);

      return difference <= days;
    });
  }, [purchases, dateFilter]);

  const totalPurchase = filteredPurchases.reduce(
    (sum, purchase) =>
      sum + Number(purchase.amount || 0),
    0
  );

  const totalOrders = filteredPurchases.length;

  const totalItems = filteredPurchases.reduce(
    (sum, purchase) =>
      sum + Number(purchase.items || 0),
    0
  );

  const pendingOrders = filteredPurchases.filter(
    (purchase) =>
      purchase.status?.toLowerCase() === "pending"
  ).length;

  const averagePurchase =
    totalOrders > 0
      ? totalPurchase / totalOrders
      : 0;

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString(
      "en-IN"
    )}`;

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const handleExport = () => {
    alert(
      "Purchase report export will be connected soon."
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <Link
              to="/reports"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              <ArrowLeft size={16} />
              Back to Reports
            </Link>

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
                <ShoppingCart
                  size={24}
                  className="text-blue-400"
                />
              </div>

              <div>
                <h1 className="text-3xl font-bold sm:text-4xl">
                  Purchase Report
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                  Analyze purchases and supplier transactions.
                </p>
              </div>

            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">

            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5">

              <CalendarDays
                size={17}
                className="text-slate-500"
              />

              <select
                value={dateFilter}
                onChange={(e) =>
                  setDateFilter(e.target.value)
                }
                className="bg-transparent text-sm text-slate-300 outline-none"
              >
                <option value="All">
                  All Time
                </option>

                <option value="7">
                  Last 7 Days
                </option>

                <option value="30">
                  Last 30 Days
                </option>

                <option value="90">
                  Last 90 Days
                </option>
              </select>

            </div>

            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              <Download size={17} />
              Export
            </button>

          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <SummaryCard
            label="Total Purchase"
            value={formatCurrency(totalPurchase)}
            icon={IndianRupee}
            iconColor="text-blue-400"
          />

          <SummaryCard
            label="Purchase Orders"
            value={totalOrders}
            icon={ReceiptText}
            iconColor="text-emerald-400"
          />

          <SummaryCard
            label="Items Purchased"
            value={totalItems}
            icon={Package}
            iconColor="text-violet-400"
          />

          <SummaryCard
            label="Pending Orders"
            value={pendingOrders}
            icon={Truck}
            iconColor="text-amber-400"
          />
        </div>

        {/* Purchase Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

          <div className="flex flex-col gap-3 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-lg font-semibold">
                Purchase Transactions
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Showing {filteredPurchases.length} purchase transactions
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-400">
              {dateFilter === "All"
                ? "All Records"
                : `Last ${dateFilter} Days`}
            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px]">

              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-xs uppercase tracking-wide text-slate-500">

                  <th className="px-5 py-4 text-left">
                    Purchase No.
                  </th>

                  <th className="px-5 py-4 text-left">
                    Date
                  </th>

                  <th className="px-5 py-4 text-left">
                    Supplier
                  </th>

                  <th className="px-5 py-4 text-center">
                    Items
                  </th>

                  <th className="px-5 py-4 text-left">
                    Payment
                  </th>

                  <th className="px-5 py-4 text-left">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right">
                    Amount
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredPurchases.map((purchase) => (
                  <tr
                    key={purchase.id}
                    className="border-b border-slate-800 transition hover:bg-slate-800/40"
                  >

                    <td className="px-5 py-4">
                      <span className="font-medium text-slate-200">
                        {purchase.purchaseNo ||
                          purchase.billNo ||
                          purchase.purchase_number ||
                          "-"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-400">
                      {formatDate(purchase.date)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">

                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                          <Truck
                            size={15}
                            className="text-blue-400"
                          />
                        </div>

                        <span className="text-sm text-slate-300">
                          {purchase.supplier || "-"}
                        </span>

                      </div>
                    </td>

                    <td className="px-5 py-4 text-center text-sm text-slate-400">
                      {purchase.items || 0}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                        {purchase.paymentMode ||
                          purchase.paymentMethod ||
                          purchase.payment ||
                          "-"}
                      </span>
                    </td>

                    <td className="px-5 py-4">

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${purchase.status === "Received"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-amber-500/10 text-amber-400"
                          }`}
                      >
                        {purchase.status || "Pending"}
                      </span>

                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-blue-400">
                      {formatCurrency(purchase.amount)}
                    </td>

                  </tr>
                ))}

                {filteredPurchases.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-5 py-12 text-center"
                    >
                      <div className="flex flex-col items-center">

                        <ReceiptText
                          size={35}
                          className="mb-3 text-slate-700"
                        />

                        <p className="font-medium text-slate-400">
                          No purchase records found
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          Try changing the selected date range.
                        </p>

                      </div>
                    </td>
                  </tr>
                )}

              </tbody>

              {filteredPurchases.length > 0 && (
                <tfoot>

                  <tr className="bg-slate-950/60">

                    <td
                      colSpan="6"
                      className="px-5 py-5 text-right text-sm font-semibold text-slate-400"
                    >
                      Total Purchase
                    </td>

                    <td className="px-5 py-5 text-right text-lg font-bold text-blue-400">
                      {formatCurrency(totalPurchase)}
                    </td>

                  </tr>

                </tfoot>
              )}

            </table>

          </div>
        </div>

        {/* Bottom Insight */}
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">

          <div className="flex items-start gap-4">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
              <TrendingDown
                size={19}
                className="text-blue-400"
              />
            </div>

            <div>
              <h3 className="font-semibold">
                Purchase Overview
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Total purchases for the selected period are{" "}
                <span className="font-medium text-slate-300">
                  {formatCurrency(totalPurchase)}
                </span>{" "}
                across{" "}
                <span className="font-medium text-slate-300">
                  {totalOrders}
                </span>{" "}
                purchase orders with an average purchase value of{" "}
                <span className="font-medium text-slate-300">
                  {formatCurrency(averagePurchase)}
                </span>.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  iconColor,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

      <div className="flex items-center justify-between">

        <p className="text-sm text-slate-400">
          {label}
        </p>

        <Icon
          size={20}
          className={iconColor}
        />

      </div>

      <h3 className="mt-3 text-2xl font-bold tracking-tight">
        {value}
      </h3>

    </div>
  );
}

