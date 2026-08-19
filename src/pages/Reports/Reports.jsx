
import { Link } from "react-router-dom";
import {
  BarChart3,
  ShoppingCart,
  Package,
  TrendingUp,
  ReceiptText,
  Users,
  Truck,
  AlertTriangle,
  ArrowUpRight,
  FileText,
  CalendarDays,
} from "lucide-react";

import { useMemo } from "react";
import { useReport } from "../../context/ReportContext";
import { useExpense } from "../../context/ExpenseContext";

export default function Reports() {

  const {
    salesRecords = [],
    purchaseRecords = [],
    stockItems = [],
  } = useReport();

  const {
    rentHistory = [],
    electricityRecords = [],
    staffSalaryRecords = [],
    miscExpenses = [],
  } = useExpense();

  const reports = [
    {
      title: "Sales Report",
      description: "Analyze sales transactions and revenue.",
      path: "/reports/sales",
      icon: BarChart3,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
    },
    {
      title: "Purchase Report",
      description: "Review purchases and supplier transactions.",
      path: "/reports/purchase",
      icon: ShoppingCart,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
    },
    {
      title: "Stock Report",
      description: "View current inventory and stock movement.",
      path: "/reports/stock",
      icon: Package,
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-400",
    },
    {
      title: "Profit Report",
      description: "Track revenue, costs and overall profit.",
      path: "/reports/profit",
      icon: TrendingUp,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
    },
    {
      title: "Expense Report",
      description: "Monitor rent, salary and business expenses.",
      path: "/reports/expense",
      icon: ReceiptText,
      iconBg: "bg-rose-500/10",
      iconColor: "text-rose-400",
    },
    {
      title: "Customer Report",
      description: "View customer activity and transactions.",
      path: "/reports/customer",
      icon: Users,
      iconBg: "bg-cyan-500/10",
      iconColor: "text-cyan-400",
    },
    {
      title: "Supplier Report",
      description: "Review supplier purchases and balances.",
      path: "/reports/supplier",
      icon: Truck,
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-400",
    },
    {
      title: "Low Stock Report",
      description: "Identify products that need restocking.",
      path: "/reports/low-stock",
      icon: AlertTriangle,
      iconBg: "bg-red-500/10",
      iconColor: "text-red-400",
    },
  ];

  const totalSales = useMemo(
    () =>
      salesRecords.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ),
    [salesRecords]
  );

  const totalPurchase = useMemo(
    () =>
      purchaseRecords.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ),
    [purchaseRecords]
  );

  const totalExpenses = useMemo(() => {
    const rent = rentHistory.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const electricity = electricityRecords.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const salary = staffSalaryRecords.reduce(
      (sum, item) =>
        sum +
        Number(item.salary || item.amount || 0),
      0
    );

    const misc = miscExpenses.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    return rent + electricity + salary + misc;
  }, [
    rentHistory,
    electricityRecords,
    staffSalaryRecords,
    miscExpenses,
  ]);

  const netProfit =
    totalSales -
    totalPurchase -
    totalExpenses;

  const lowStockCount = stockItems.filter(
    (item) =>
      Number(item.stock) <=
      Number(item.minStock)
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <FileText size={16} />
              <span>Business Analytics</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Reports
            </h1>

            <p className="mt-2 text-slate-400">
              View, analyze and manage your business reports.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
            <CalendarDays
              size={18}
              className="text-emerald-400"
            />

            <div>
              <p className="text-xs text-slate-500">
                Report Period
              </p>

              <p className="text-sm font-medium text-slate-200">
                August 2026
              </p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <SummaryCard
            label="Total Sales"
            value={`₹${totalSales.toLocaleString("en-IN")}`}
            change="Live Data"
            icon={BarChart3}
            iconColor="text-emerald-400"
          />

          <SummaryCard
            label="Total Purchase"
            value={`₹${totalPurchase.toLocaleString("en-IN")}`}
            change="Live Data"
            icon={ShoppingCart}
            iconColor="text-blue-400"
          />

          <SummaryCard
            label="Net Profit"
            value={`₹${netProfit.toLocaleString("en-IN")}`}
            change="Calculated"
            icon={TrendingUp}
            iconColor="text-amber-400"
          />

          <SummaryCard
            label="Low Stock Items"
            value={lowStockCount}
            change={
              lowStockCount > 0
                ? "Needs attention"
                : "Stock Healthy"
            }
            icon={AlertTriangle}
            iconColor="text-rose-400"
            warning={lowStockCount > 0}
          />
        </div>

        {/* Reports Header */}
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Available Reports
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select a report to view detailed information.
            </p>
          </div>

          <span className="hidden rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-400 sm:block">
            {reports.length} Reports
          </span>
        </div>

        {/* Reports */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {reports.map((report) => {
            const Icon = report.icon;

            return (
              <Link
                key={report.title}
                to={report.path}
                className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-900/80"
              >
                <div className="flex items-start justify-between">

                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${report.iconBg}`}
                  >
                    <Icon
                      size={21}
                      className={report.iconColor}
                    />
                  </div>

                  <div className="rounded-lg p-2 text-slate-600 transition group-hover:bg-slate-800 group-hover:text-slate-300">
                    <ArrowUpRight size={18} />
                  </div>
                </div>

                <h3 className="mt-5 text-base font-semibold text-white">
                  {report.title}
                </h3>

                <p className="mt-2 min-h-[40px] text-sm leading-5 text-slate-500">
                  {report.description}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
                  <span className="text-xs font-medium text-slate-500 transition group-hover:text-emerald-400">
                    View Report
                  </span>

                  <span className="text-xs text-slate-600">
                    →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Insight */}
        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                <TrendingUp
                  size={19}
                  className="text-emerald-400"
                />
              </div>

              <div>
                <h3 className="font-semibold">
                  Business Overview
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Your reports help you monitor sales, purchases,
                  inventory, profit and expenses from one place.
                </p>
              </div>
            </div>

            <Link
              to="/reports/profit"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400"
            >
              View Profit
              <ArrowUpRight size={16} />
            </Link>

          </div>
        </div>

      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  change,
  icon: Icon,
  iconColor,
  warning = false,
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

      <p
        className={`mt-2 text-xs font-medium ${warning
          ? "text-rose-400"
          : "text-emerald-400"
          }`}
      >
        {change}
      </p>
    </div>
  );
}

