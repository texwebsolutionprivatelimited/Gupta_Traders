
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useReport } from "../../context/ReportContext";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Download,
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  ReceiptText,
} from "lucide-react";

export default function SalesReport() {
  const { salesRecords } = useReport();

  const sales = salesRecords || [];

  const [dateFilter, setDateFilter] = useState("All");

  const filteredSales = useMemo(() => {
    if (dateFilter === "All") {
      return sales;
    }

    const today = new Date();
    const days = Number(dateFilter);

    return sales.filter((sale) => {
      const saleDate = new Date(
        `${sale.date}T00:00:00`
      );

      const difference =
        (today - saleDate) /
        (1000 * 60 * 60 * 24);

      return difference < days;
    });
  }, [sales, dateFilter]);

  const totalSales = filteredSales.reduce(
    (sum, sale) =>
      sum + Number(sale.amount || 0),
    0
  );

  const totalInvoices = filteredSales.length;

  const totalItems = filteredSales.reduce(
    (sum, sale) =>
      sum + Number(sale.items || 0),
    0
  );

  const averageSale =
    totalInvoices > 0
      ? totalSales / totalInvoices
      : 0;

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString(
      "en-IN"
    )}`;

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleExport = () => {
    alert(
      "Sales report export will be connected soon."
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">

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
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10">
                <BarChart3
                  size={24}
                  className="text-emerald-400"
                />
              </div>

              <div>
                <h1 className="text-3xl font-bold sm:text-4xl">
                  Sales Report
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                  Analyze sales transactions and revenue.
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
              onClick={handleExport}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold"
            >
              <Download size={17} />
              Export
            </button>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total Sales"
            value={formatCurrency(totalSales)}
            icon={IndianRupee}
            iconColor="text-emerald-400"
          />

          <SummaryCard
            label="Total Invoices"
            value={totalInvoices}
            icon={ReceiptText}
            iconColor="text-blue-400"
          />

          <SummaryCard
            label="Items Sold"
            value={totalItems}
            icon={ShoppingBag}
            iconColor="text-violet-400"
          />

          <SummaryCard
            label="Average Sale"
            value={formatCurrency(averageSale)}
            icon={TrendingUp}
            iconColor="text-amber-400"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-5">
            <h2 className="text-lg font-semibold">
              Sales Transactions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Showing {filteredSales.length} sales
              transactions
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-xs uppercase text-slate-500">
                  <th className="px-5 py-4 text-left">
                    Invoice
                  </th>
                  <th className="px-5 py-4 text-left">
                    Date
                  </th>
                  <th className="px-5 py-4 text-left">
                    Customer
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
                {filteredSales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="border-b border-slate-800 hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-4">
                      {sale.invoiceNo}
                    </td>

                    <td className="px-5 py-4 text-slate-400">
                      {formatDate(sale.date)}
                    </td>

                    <td className="px-5 py-4">
                      {sale.customer || "-"}
                    </td>

                    <td className="px-5 py-4 text-center">
                      {sale.items || 0}
                    </td>

                    <td className="px-5 py-4">
                      {sale.paymentMode || "-"}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                        {sale.status || "Paid"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-emerald-400">
                      {formatCurrency(sale.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr className="bg-slate-950/60">
                  <td
                    colSpan="6"
                    className="px-5 py-5 text-right"
                  >
                    Total Sales
                  </td>

                  <td className="px-5 py-5 text-right text-lg font-bold text-emerald-400">
                    {formatCurrency(totalSales)}
                  </td>
                </tr>
              </tfoot>
            </table>
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

      <h3 className="mt-3 text-2xl font-bold">
        {value}
      </h3>
    </div>
  );
}


