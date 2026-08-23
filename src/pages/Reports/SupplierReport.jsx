import { useMemo } from "react";
import { Link } from "react-router-dom";

export default function SupplierReport() {
    const suppliers = [
        {
            id: 1,
            name: "ABC Cement Suppliers",
            phone: "9876500011",
            category: "Cement",
            totalPurchase: 95000,
            dueAmount: 12000,
        },
        {
            id: 2,
            name: "Shree Traders",
            phone: "9876500022",
            category: "Steel",
            totalPurchase: 125000,
            dueAmount: 5000,
        },
        {
            id: 3,
            name: "Raj Hardware",
            phone: "9876500033",
            category: "Hardware",
            totalPurchase: 72000,
            dueAmount: 0,
        },
        {
            id: 4,
            name: "Gupta Building Materials",
            phone: "9876500044",
            category: "Tiles",
            totalPurchase: 88000,
            dueAmount: 8000,
        },
    ];

    const stats = useMemo(() => {
        return {
            suppliers: suppliers.length,
            purchase: suppliers.reduce(
                (sum, item) => sum + item.totalPurchase,
                0
            ),
            due: suppliers.reduce(
                (sum, item) => sum + item.dueAmount,
                0
            ),
        };
    }, [suppliers]);

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

                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 print:text-black sm:text-4xl">
                            Supplier Report
                        </h1>

                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 print:text-slate-700 sm:text-base">
                            Supplier purchase and payment report.
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

                {/* Stat Cards */}
                <div className="mb-6 grid gap-5 md:grid-cols-3 print:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:border-slate-300 print:bg-white">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 print:text-slate-600">
                            Total Suppliers
                        </p>

                        <h2 className="mt-2 text-3xl font-bold text-cyan-600 dark:text-cyan-400 print:text-cyan-700">
                            {stats.suppliers}
                        </h2>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:border-slate-300 print:bg-white">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 print:text-slate-600">
                            Total Purchase
                        </p>

                        <h2 className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400 print:text-amber-700">
                            ₹{stats.purchase.toLocaleString("en-IN")}
                        </h2>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:border-slate-300 print:bg-white">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 print:text-slate-600">
                            Total Due
                        </p>

                        <h2 className="mt-2 text-3xl font-bold text-rose-600 dark:text-rose-400 print:text-rose-700">
                            ₹{stats.due.toLocaleString("en-IN")}
                        </h2>
                    </div>
                </div>

                {/* Supplier Details Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 print:border-slate-300 print:bg-white">
                    <div className="border-b border-slate-200 p-5 dark:border-slate-800 print:border-slate-300">
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 print:text-black">
                            Supplier Details
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-100 dark:bg-slate-800/60 print:bg-slate-100">
                                <tr className="text-slate-600 dark:text-slate-300 print:text-slate-800">
                                    <th className="p-4 text-left font-semibold">
                                        Supplier
                                    </th>
                                    <th className="p-4 text-left font-semibold">
                                        Phone
                                    </th>
                                    <th className="p-4 text-left font-semibold">
                                        Category
                                    </th>
                                    <th className="p-4 text-right font-semibold">
                                        Purchase
                                    </th>
                                    <th className="p-4 text-right font-semibold">
                                        Due Amount
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {suppliers.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-t border-slate-200 dark:border-slate-800 print:border-slate-300"
                                    >
                                        <td className="p-4 font-medium text-slate-900 dark:text-slate-100 print:text-black">
                                            {item.name}
                                        </td>

                                        <td className="p-4 text-slate-600 dark:text-slate-400 print:text-slate-700">
                                            {item.phone}
                                        </td>

                                        <td className="p-4 text-slate-600 dark:text-slate-400 print:text-slate-700">
                                            {item.category}
                                        </td>

                                        <td className="p-4 text-right font-semibold text-amber-600 dark:text-amber-400 print:text-amber-700">
                                            ₹{item.totalPurchase.toLocaleString("en-IN")}
                                        </td>

                                        <td className="p-4 text-right font-semibold text-rose-600 dark:text-rose-400 print:text-rose-700">
                                            ₹{item.dueAmount.toLocaleString("en-IN")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}