import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useExpense } from "../../context/ExpenseContext";

export default function ExpenseReport() {
    const {
        rentHistory = [],
        electricityRecords = [],
        staffSalaryRecords = [],
        miscExpenses = [],
    } = useExpense();

    const reportData = useMemo(() => {
        const rentTotal = rentHistory.reduce(
            (sum, item) => sum + Number(item.amount || 0),
            0
        );

        const electricityTotal = electricityRecords.reduce(
            (sum, item) => sum + Number(item.amount || 0),
            0
        );

        const salaryTotal = staffSalaryRecords.reduce(
            (sum, item) => sum + Number(item.amount || item.salary || 0),
            0
        );

        const miscTotal = miscExpenses.reduce(
            (sum, item) => sum + Number(item.amount || 0),
            0
        );

        return {
            rentTotal,
            electricityTotal,
            salaryTotal,
            miscTotal,
            grandTotal:
                rentTotal +
                electricityTotal +
                salaryTotal +
                miscTotal,
        };
    }, [
        rentHistory,
        electricityRecords,
        staffSalaryRecords,
        miscExpenses,
    ]);

    const categories = [
        {
            name: "Rent",
            amount: reportData.rentTotal,
            color: "text-blue-600 dark:text-blue-400 print:text-blue-700",
        },
        {
            name: "Electricity",
            amount: reportData.electricityTotal,
            color: "text-amber-600 dark:text-yellow-400 print:text-amber-700",
        },
        {
            name: "Staff Salary",
            amount: reportData.salaryTotal,
            color: "text-emerald-600 dark:text-emerald-400 print:text-emerald-700",
        },
        {
            name: "Miscellaneous",
            amount: reportData.miscTotal,
            color: "text-purple-600 dark:text-purple-400 print:text-purple-700",
        },
    ];

    return (
        <div className="printable-report min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 p-4 sm:p-6 lg:p-8 print:p-0 print:bg-white print:text-black">
            
            {/* Embedded Print CSS */}
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

                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white print:text-black sm:text-4xl">
                            Expense Report
                        </h1>

                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 print:text-slate-700 sm:text-base">
                            Overview of all business expenses.
                        </p>
                    </div>

                    <div className="no-print">
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            🖨️ Print
                        </button>
                    </div>
                </div>

                {/* Summary */}
                <div className="mb-8 rounded-3xl border border-rose-200 bg-rose-50/60 p-6 dark:border-rose-500/20 dark:bg-gradient-to-r dark:from-rose-500/10 dark:to-red-500/5 print:border-slate-300 print:bg-slate-50">
                    <p className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 print:text-slate-600">
                        Total Expenses
                    </p>

                    <h2 className="mt-3 text-4xl font-bold text-rose-600 dark:text-rose-400 print:text-rose-700">
                        ₹{reportData.grandTotal.toLocaleString("en-IN")}
                    </h2>
                </div>

                {/* Category Cards */}
                <div className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4 print:grid-cols-2">
                    {categories.map((item) => (
                        <div
                            key={item.name}
                            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:border-slate-300 print:bg-white"
                        >
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 print:text-slate-600">
                                {item.name}
                            </p>

                            <h3
                                className={`mt-3 text-3xl font-bold ${item.color}`}
                            >
                                ₹{item.amount.toLocaleString("en-IN")}
                            </h3>
                        </div>
                    ))}
                </div>

                {/* Table Section */}
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 print:border-slate-300 print:bg-white">
                    <div className="border-b border-slate-200 p-6 dark:border-slate-800 print:border-slate-300">
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white print:text-black">
                            Expense Breakdown
                        </h2>
                    </div>

                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400 print:border-slate-300 print:text-slate-600">
                                <th className="px-6 py-4 text-left font-medium">
                                    Category
                                </th>

                                <th className="px-6 py-4 text-right font-medium">
                                    Amount
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {categories.map((item) => (
                                <tr
                                    key={item.name}
                                    className="border-b border-slate-200 dark:border-slate-800 print:border-slate-300"
                                >
                                    <td className="px-6 py-4 text-slate-800 dark:text-slate-200 print:text-black font-medium">
                                        {item.name}
                                    </td>

                                    <td
                                        className={`px-6 py-4 text-right font-semibold ${item.color}`}
                                    >
                                        ₹{item.amount.toLocaleString("en-IN")}
                                    </td>
                                </tr>
                            ))}

                            <tr>
                                <td className="px-6 py-5 text-lg font-bold text-slate-900 dark:text-white print:text-black">
                                    Grand Total
                                </td>

                                <td className="px-6 py-5 text-right text-lg font-bold text-rose-600 dark:text-rose-400 print:text-rose-700">
                                    ₹{reportData.grandTotal.toLocaleString(
                                        "en-IN"
                                    )}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}