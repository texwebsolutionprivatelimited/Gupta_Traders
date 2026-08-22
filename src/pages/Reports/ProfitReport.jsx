import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useExpense } from "../../context/ExpenseContext";
import { useReport } from "../../context/ReportContext";

export default function ProfitReport() {
    const {
        rentHistory = [],
        electricityRecords = [],
        staffSalaryRecords = [],
        miscExpenses = [],
    } = useExpense();

    const {
        salesRecords = [],
        purchaseRecords = [],
    } = useReport();

    const [period, setPeriod] = useState("Monthly");

    // ---------------------------------------------------------
    // Expense calculations
    // ---------------------------------------------------------

    const rentExpense = useMemo(
        () =>
            rentHistory.reduce(
                (sum, item) => sum + Number(item.amount || 0),
                0
            ),
        [rentHistory]
    );

    const electricityExpense = useMemo(
        () =>
            electricityRecords.reduce(
                (sum, item) => sum + Number(item.amount || 0),
                0
            ),
        [electricityRecords]
    );

    const salaryExpense = useMemo(
        () =>
            staffSalaryRecords.reduce(
                (sum, item) =>
                    sum + Number(item.salary ?? item.amount ?? 0),
                0
            ),
        [staffSalaryRecords]
    );

    const miscellaneousExpense = useMemo(
        () =>
            miscExpenses.reduce(
                (sum, item) => sum + Number(item.amount || 0),
                0
            ),
        [miscExpenses]
    );

    const totalExpenses =
        rentExpense +
        electricityExpense +
        salaryExpense +
        miscellaneousExpense;

    // ---------------------------------------------------------
    // Sales/Purchase calculations
    // ---------------------------------------------------------

    const totalSales = useMemo(
        () =>
            salesRecords.reduce(
                (sum, item) =>
                    sum + Number(item.amount || 0),
                0
            ),
        [salesRecords]
    );

    const totalPurchase = useMemo(
        () =>
            purchaseRecords.reduce(
                (sum, item) =>
                    sum + Number(item.amount || 0),
                0
            ),
        [purchaseRecords]
    );

    const grossProfit = totalSales - totalPurchase;

    const netProfit = grossProfit - totalExpenses;

    const profitMargin =
        totalSales > 0
            ? (netProfit / totalSales) * 100
            : 0;

    const formatCurrency = (value) =>
        `₹${Number(value || 0).toLocaleString("en-IN")}`;

    // ---------------------------------------------------------
    // Expense breakdown
    // ---------------------------------------------------------

    const expenseBreakdown = [
        {
            title: "Rent",
            amount: rentExpense,
            color: "text-blue-600 dark:text-blue-400 print:text-blue-700",
            bg: "bg-blue-50 dark:bg-blue-500/10 print:bg-blue-50",
            border: "border-slate-200 dark:border-blue-500/20 print:border-slate-300",
            icon: "🏢",
        },
        {
            title: "Electricity",
            amount: electricityExpense,
            color: "text-amber-600 dark:text-yellow-400 print:text-amber-700",
            bg: "bg-amber-50 dark:bg-yellow-500/10 print:bg-amber-50",
            border: "border-slate-200 dark:border-yellow-500/20 print:border-slate-300",
            icon: "⚡",
        },
        {
            title: "Staff Salary",
            amount: salaryExpense,
            color: "text-emerald-600 dark:text-emerald-400 print:text-emerald-700",
            bg: "bg-emerald-50 dark:bg-emerald-500/10 print:bg-emerald-50",
            border: "border-slate-200 dark:border-emerald-500/20 print:border-slate-300",
            icon: "👨‍💼",
        },
        {
            title: "Miscellaneous",
            amount: miscellaneousExpense,
            color: "text-purple-600 dark:text-purple-400 print:text-purple-700",
            bg: "bg-purple-50 dark:bg-purple-500/10 print:bg-purple-50",
            border: "border-slate-200 dark:border-purple-500/20 print:border-slate-300",
            icon: "📦",
        },
    ];

    return (
        <div className="printable-report min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 p-4 sm:p-6 lg:p-8 print:p-0 print:bg-white print:text-black">
            
            {/* Embedded CSS specifically for clean printing */}
            <style>
                {`
                @media print {
                    body {
                        background: #ffffff !important;
                        color: #000000 !important;
                    }
                    .printable-report {
                        background: #ffffff !important;
                        color: #000000 !important;
                        padding: 0 !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
                `}
            </style>

            <div className="mx-auto max-w-7xl">

                {/* Header */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                        <Link
                            to="/reports"
                            className="no-print mb-3 inline-flex text-sm font-medium text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                        >
                            ← Back to Reports
                        </Link>

                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 print:text-black sm:text-4xl">
                            Profit Report
                        </h1>

                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 print:text-slate-700 sm:text-base">
                            Analyze sales, purchases, expenses and overall profit.
                        </p>
                    </div>

                    {/* Compact Controls (Hidden during print) */}
                    <div className="no-print flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                            <option className="bg-white text-slate-800 dark:bg-slate-800 dark:text-white">Monthly</option>
                            <option className="bg-white text-slate-800 dark:bg-slate-800 dark:text-white">Quarterly</option>
                            <option className="bg-white text-slate-800 dark:bg-slate-800 dark:text-white">Yearly</option>
                        </select>

                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                            🖨️ Print
                        </button>
                    </div>
                </div>

                {/* Main Profit Card */}
                <div
                    className={`mb-6 overflow-hidden rounded-3xl border p-6 sm:p-8 print:border-slate-300 print:bg-slate-50 ${netProfit >= 0
                        ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-gradient-to-br dark:from-emerald-500/15 dark:via-slate-900 dark:to-slate-900"
                        : "border-rose-200 bg-rose-50/50 dark:border-rose-500/20 dark:bg-gradient-to-br dark:from-rose-500/15 dark:via-slate-900 dark:to-slate-900"
                        }`}
                >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                        <div>
                            <p className="text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 print:text-slate-600 font-medium">
                                {period} Net Profit
                            </p>

                            <h2
                                className={`mt-3 text-4xl font-bold sm:text-5xl ${netProfit >= 0
                                    ? "text-emerald-600 dark:text-emerald-400 print:text-emerald-700"
                                    : "text-rose-600 dark:text-rose-400 print:text-rose-700"
                                    }`}
                            >
                                {formatCurrency(netProfit)}
                            </h2>

                            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 print:text-slate-700">
                                Profit after deducting all recorded business expenses.
                            </p>
                        </div>

                        <div
                            className={`rounded-2xl border px-6 py-5 print:border-slate-300 print:bg-white ${netProfit >= 0
                                ? "border-emerald-200 bg-emerald-100/60 dark:border-emerald-500/20 dark:bg-emerald-500/10"
                                : "border-rose-200 bg-rose-100/60 dark:border-rose-500/20 dark:bg-rose-500/10"
                                }`}
                        >
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 print:text-slate-600">
                                Profit Margin
                            </p>

                            <p
                                className={`mt-2 text-3xl font-bold ${netProfit >= 0
                                    ? "text-emerald-600 dark:text-emerald-400 print:text-emerald-700"
                                    : "text-rose-600 dark:text-rose-400 print:text-rose-700"
                                    }`}
                            >
                                {profitMargin.toFixed(2)}%
                            </p>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4 print:grid-cols-2">

                    <SummaryCard
                        title="Total Sales"
                        value={formatCurrency(totalSales)}
                        subtitle="Revenue generated"
                        icon="💰"
                        color="text-cyan-600 dark:text-cyan-400 print:text-cyan-700"
                    />

                    <SummaryCard
                        title="Total Purchase"
                        value={formatCurrency(totalPurchase)}
                        subtitle="Cost of inventory"
                        icon="🛒"
                        color="text-orange-600 dark:text-orange-400 print:text-orange-700"
                    />

                    <SummaryCard
                        title="Gross Profit"
                        value={formatCurrency(grossProfit)}
                        subtitle="Sales - Purchase"
                        icon="📈"
                        color="text-blue-600 dark:text-blue-400 print:text-blue-700"
                    />

                    <SummaryCard
                        title="Total Expenses"
                        value={formatCurrency(totalExpenses)}
                        subtitle="Operating expenses"
                        icon="💸"
                        color="text-rose-600 dark:text-rose-400 print:text-rose-700"
                    />

                </div>

                {/* Profit Calculation & Breakdown */}
                <div className="mb-6 grid gap-6 lg:grid-cols-2 print:grid-cols-2">

                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:border-slate-300 print:bg-white">

                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 print:text-black">
                                Profit Calculation
                            </h2>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 print:text-slate-600">
                                Complete profit calculation for {period.toLowerCase()} period.
                            </p>
                        </div>

                        <div className="space-y-4">

                            <CalculationRow
                                label="Total Sales"
                                value={totalSales}
                                color="text-cyan-600 dark:text-cyan-400 print:text-cyan-700"
                            />

                            <CalculationRow
                                label="Less: Purchase Cost"
                                value={-totalPurchase}
                                color="text-orange-600 dark:text-orange-400 print:text-orange-700"
                            />

                            <div className="border-t border-slate-200 dark:border-slate-800 print:border-slate-300 pt-4">
                                <CalculationRow
                                    label="Gross Profit"
                                    value={grossProfit}
                                    color="text-blue-600 dark:text-blue print:text-blue-700"
                                    bold
                                />
                            </div>

                            <CalculationRow
                                label="Less: Total Expenses"
                                value={-totalExpenses}
                                color="text-rose-600 dark:text-rose-400 print:text-rose-700"
                            />

                            <div className="border-t border-slate-200 dark:border-slate-800 print:border-slate-300 pt-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-semibold text-slate-900 dark:text-slate-50 print:text-black">
                                        Net Profit
                                    </span>

                                    <span
                                        className={`text-2xl font-bold ${netProfit >= 0
                                            ? "text-emerald-600 dark:text-emerald-400 print:text-emerald-700"
                                            : "text-rose-600 dark:text-rose-400 print:text-rose-700"
                                            }`}
                                    >
                                        {formatCurrency(netProfit)}
                                    </span>
                                </div>
                            </div>

                        </div>
                    </section>

                    {/* Expense Breakdown */}
                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:border-slate-300 print:bg-white">

                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 print:text-black">
                                Expense Breakdown
                            </h2>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 print:text-slate-600">
                                Expenses currently recorded in the system.
                            </p>
                        </div>

                        <div className="space-y-3">

                            {expenseBreakdown.map((expense) => (
                                <div
                                    key={expense.title}
                                    className={`flex items-center justify-between rounded-2xl border ${expense.border} ${expense.bg} p-4`}
                                >
                                    <div className="flex items-center gap-3">

                                        <div className="rounded-xl bg-white p-3 text-xl shadow-sm dark:bg-slate-800 print:bg-slate-100">
                                            {expense.icon}
                                        </div>

                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-slate-100 print:text-black">
                                                {expense.title}
                                            </p>

                                            <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600">
                                                Business expense
                                            </p>
                                        </div>

                                    </div>

                                    <p className={`font-bold ${expense.color}`}>
                                        {formatCurrency(expense.amount)}
                                    </p>
                                </div>
                            ))}

                            <div className="mt-5 border-t border-slate-200 dark:border-slate-800 print:border-slate-300 pt-5">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-slate-900 dark:text-slate-50 print:text-black">
                                        Total Expenses
                                    </span>

                                    <span className="text-xl font-bold text-rose-600 dark:text-rose-400 print:text-rose-700">
                                        {formatCurrency(totalExpenses)}
                                    </span>
                                </div>
                            </div>

                        </div>
                    </section>
                </div>

                {/* Performance */}
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:border-slate-300 print:bg-white">

                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 print:text-black">
                            Business Performance
                        </h2>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 print:text-slate-600">
                            Quick overview of your business profitability.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3 print:grid-cols-3">

                        <PerformanceCard
                            title="Revenue"
                            value={formatCurrency(totalSales)}
                            description="Total sales generated"
                            color="text-cyan-600 dark:text-cyan-400 print:text-cyan-700"
                        />

                        <PerformanceCard
                            title="Gross Profit"
                            value={formatCurrency(grossProfit)}
                            description="Profit before expenses"
                            color="text-blue-600 dark:text-blue-400 print:text-blue-700"
                        />

                        <PerformanceCard
                            title="Net Profit"
                            value={formatCurrency(netProfit)}
                            description="Final profit after expenses"
                            color={
                                netProfit >= 0
                                    ? "text-emerald-600 dark:text-emerald-400 print:text-emerald-700"
                                    : "text-rose-600 dark:text-rose-400 print:text-rose-700"
                            }
                        />

                    </div>
                </section>

            </div>
        </div>
    );
}

function SummaryCard({
    title,
    value,
    subtitle,
    icon,
    color,
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition dark:border-slate-800 dark:bg-slate-900 print:border-slate-300 print:bg-white">

            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 print:text-slate-600">
                        {title}
                    </p>

                    <h3 className={`mt-2 text-2xl font-bold ${color}`}>
                        {value}
                    </h3>

                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 print:text-slate-600">
                        {subtitle}
                    </p>
                </div>

                <div className="rounded-xl bg-slate-100 p-3 text-xl dark:bg-slate-800 print:bg-slate-100">
                    {icon}
                </div>
            </div>

        </div>
    );
}

function CalculationRow({
    label,
    value,
    color,
    bold = false,
}) {
    const amount = Number(value || 0);

    const formatted =
        amount < 0
            ? `- ₹${Math.abs(amount).toLocaleString("en-IN")}`
            : `₹${amount.toLocaleString("en-IN")}`;

    return (
        <div className="flex items-center justify-between">
            <span
                className={
                    bold
                        ? "font-semibold text-slate-900 dark:text-white print:text-black"
                        : "text-slate-600 dark:text-slate-400 print:text-slate-700"
                }
            >
                {label}
            </span>

            <span
                className={`font-semibold ${color}`}
            >
                {formatted}
            </span>
        </div>
    );
}

function PerformanceCard({
    title,
    value,
    description,
    color,
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950 print:border-slate-300 print:bg-slate-50">

            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 print:text-slate-600">
                {title}
            </p>

            <h3 className={`mt-2 text-2xl font-bold ${color}`}>
                {value}
            </h3>

            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 print:text-slate-600">
                {description}
            </p>

        </div>
    );
}