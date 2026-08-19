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
    // Demo sales/purchase data
    // Replace these with your actual Sales/Purchase context later.
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
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
            icon: "🏢",
        },
        {
            title: "Electricity",
            amount: electricityExpense,
            color: "text-yellow-400",
            bg: "bg-yellow-500/10",
            border: "border-yellow-500/20",
            icon: "⚡",
        },
        {
            title: "Staff Salary",
            amount: salaryExpense,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
            icon: "👨‍💼",
        },
        {
            title: "Miscellaneous",
            amount: miscellaneousExpense,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20",
            icon: "📦",
        },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">

                {/* Header */}
                <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                    <div>
                        <Link
                            to="/reports"
                            className="mb-3 inline-flex text-sm font-medium text-emerald-400 transition hover:text-emerald-300"
                        >
                            ← Back to Reports
                        </Link>

                        <h1 className="text-3xl font-bold sm:text-4xl">
                            Profit Report
                        </h1>

                        <p className="mt-2 text-slate-400">
                            Analyze sales, purchases, expenses and overall profit.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                        >
                            <option>Monthly</option>
                            <option>Quarterly</option>
                            <option>Yearly</option>
                        </select>

                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                        >
                            Print Report
                        </button>
                    </div>
                </div>

                {/* Main Profit Card */}
                <div
                    className={`mb-6 overflow-hidden rounded-3xl border p-6 sm:p-8 ${netProfit >= 0
                        ? "border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 via-slate-900 to-slate-900"
                        : "border-rose-500/20 bg-gradient-to-br from-rose-500/15 via-slate-900 to-slate-900"
                        }`}
                >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                        <div>
                            <p className="text-sm uppercase tracking-wider text-slate-400">
                                {period} Net Profit
                            </p>

                            <h2
                                className={`mt-3 text-4xl font-bold sm:text-5xl ${netProfit >= 0
                                    ? "text-emerald-400"
                                    : "text-rose-400"
                                    }`}
                            >
                                {formatCurrency(netProfit)}
                            </h2>

                            <p className="mt-3 text-sm text-slate-400">
                                Profit after deducting all recorded business expenses.
                            </p>
                        </div>

                        <div
                            className={`rounded-2xl border px-6 py-5 ${netProfit >= 0
                                ? "border-emerald-500/20 bg-emerald-500/10"
                                : "border-rose-500/20 bg-rose-500/10"
                                }`}
                        >
                            <p className="text-sm text-slate-400">
                                Profit Margin
                            </p>

                            <p
                                className={`mt-2 text-3xl font-bold ${netProfit >= 0
                                    ? "text-emerald-400"
                                    : "text-rose-400"
                                    }`}
                            >
                                {profitMargin.toFixed(2)}%
                            </p>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

                    <SummaryCard
                        title="Total Sales"
                        value={formatCurrency(totalSales)}
                        subtitle="Revenue generated"
                        icon="💰"
                        color="text-cyan-400"
                    />

                    <SummaryCard
                        title="Total Purchase"
                        value={formatCurrency(totalPurchase)}
                        subtitle="Cost of inventory"
                        icon="🛒"
                        color="text-orange-400"
                    />

                    <SummaryCard
                        title="Gross Profit"
                        value={formatCurrency(grossProfit)}
                        subtitle="Sales - Purchase"
                        icon="📈"
                        color="text-blue-400"
                    />

                    <SummaryCard
                        title="Total Expenses"
                        value={formatCurrency(totalExpenses)}
                        subtitle="Operating expenses"
                        icon="💸"
                        color="text-rose-400"
                    />

                </div>

                {/* Profit Calculation */}
                <div className="mb-6 grid gap-6 lg:grid-cols-2">

                    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">

                        <div className="mb-6">
                            <h2 className="text-xl font-semibold">
                                Profit Calculation
                            </h2>

                            <p className="mt-1 text-sm text-slate-400">
                                Complete profit calculation for {period.toLowerCase()} period.
                            </p>
                        </div>

                        <div className="space-y-4">

                            <CalculationRow
                                label="Total Sales"
                                value={totalSales}
                                color="text-cyan-400"
                            />

                            <CalculationRow
                                label="Less: Purchase Cost"
                                value={-totalPurchase}
                                color="text-orange-400"
                            />

                            <div className="border-t border-slate-800 pt-4">
                                <CalculationRow
                                    label="Gross Profit"
                                    value={grossProfit}
                                    color="text-blue-400"
                                    bold
                                />
                            </div>

                            <CalculationRow
                                label="Less: Total Expenses"
                                value={-totalExpenses}
                                color="text-rose-400"
                            />

                            <div className="border-t border-slate-800 pt-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-semibold">
                                        Net Profit
                                    </span>

                                    <span
                                        className={`text-2xl font-bold ${netProfit >= 0
                                            ? "text-emerald-400"
                                            : "text-rose-400"
                                            }`}
                                    >
                                        {formatCurrency(netProfit)}
                                    </span>
                                </div>
                            </div>

                        </div>
                    </section>

                    {/* Expense Breakdown */}
                    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">

                        <div className="mb-6">
                            <h2 className="text-xl font-semibold">
                                Expense Breakdown
                            </h2>

                            <p className="mt-1 text-sm text-slate-400">
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

                                        <div className="rounded-xl bg-slate-900/70 p-3 text-xl">
                                            {expense.icon}
                                        </div>

                                        <div>
                                            <p className="font-medium">
                                                {expense.title}
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                Business expense
                                            </p>
                                        </div>

                                    </div>

                                    <p className={`font-bold ${expense.color}`}>
                                        {formatCurrency(expense.amount)}
                                    </p>
                                </div>
                            ))}

                            <div className="mt-5 border-t border-slate-800 pt-5">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold">
                                        Total Expenses
                                    </span>

                                    <span className="text-xl font-bold text-rose-400">
                                        {formatCurrency(totalExpenses)}
                                    </span>
                                </div>
                            </div>

                        </div>
                    </section>
                </div>

                {/* Performance */}
                <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">

                    <div className="mb-6">
                        <h2 className="text-xl font-semibold">
                            Business Performance
                        </h2>

                        <p className="mt-1 text-sm text-slate-400">
                            Quick overview of your business profitability.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">

                        <PerformanceCard
                            title="Revenue"
                            value={formatCurrency(totalSales)}
                            description="Total sales generated"
                            color="text-cyan-400"
                        />

                        <PerformanceCard
                            title="Gross Profit"
                            value={formatCurrency(grossProfit)}
                            description="Profit before expenses"
                            color="text-blue-400"
                        />

                        <PerformanceCard
                            title="Net Profit"
                            value={formatCurrency(netProfit)}
                            description="Final profit after expenses"
                            color={
                                netProfit >= 0
                                    ? "text-emerald-400"
                                    : "text-rose-400"
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
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700">

            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-slate-400">
                        {title}
                    </p>

                    <h3 className={`mt-2 text-2xl font-bold ${color}`}>
                        {value}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                        {subtitle}
                    </p>
                </div>

                <div className="rounded-xl bg-slate-800 p-3 text-xl">
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
                        ? "font-semibold"
                        : "text-slate-400"
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
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">

            <p className="text-sm text-slate-400">
                {title}
            </p>

            <h3 className={`mt-2 text-2xl font-bold ${color}`}>
                {value}
            </h3>

            <p className="mt-2 text-xs text-slate-500">
                {description}
            </p>

        </div>
    );
}

