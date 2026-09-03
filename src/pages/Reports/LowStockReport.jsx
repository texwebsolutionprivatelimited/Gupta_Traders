import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Search, Printer } from "lucide-react";
import { useReport } from "../../context/ReportContext";

export default function LowStockReport() {
    const [search, setSearch] = useState("");

    const { stockItems = [] } = useReport();

    const lowStockItems = stockItems.filter(
        (item) => Number(item.stock) <= Number(item.minStock)
    );

    const filteredItems = lowStockItems.filter(
        (item) =>
            item.product
                .toLowerCase()
                .includes(search.toLowerCase()) ||
            item.category
                .toLowerCase()
                .includes(search.toLowerCase())
    );

    const criticalItems = lowStockItems.filter(
        (item) =>
            Number(item.stock) <
            Number(item.minStock) / 2
    ).length;

    return (
        <div className="printable-report min-h-screen bg-slate-50 text-slate-800 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 p-4 sm:p-6 lg:p-8 print:p-0 print:bg-white print:text-black">
            
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
                            Low Stock Report
                        </h1>

                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 print:text-slate-700 sm:text-base">
                            Monitor products that need immediate restocking.
                        </p>
                    </div>

                    <div className="no-print">
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <Printer size={15} />
                            Print
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="mb-8 grid gap-6 md:grid-cols-3 print:grid-cols-3">

                    <div className="rounded-3xl border border-rose-200 bg-rose-50/50 p-6 shadow-sm dark:border-rose-500/20 dark:bg-rose-500/10 print:border-rose-300 print:bg-rose-50">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 print:text-slate-700">
                            Low Stock Products
                        </p>

                        <h2 className="mt-2 text-3xl font-bold text-rose-600 dark:text-rose-400 print:text-rose-700">
                            {lowStockItems.length}
                        </h2>
                    </div>

                    <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10 print:border-amber-300 print:bg-amber-50">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 print:text-slate-700">
                            Critical Items
                        </p>

                        <h2 className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400 print:text-amber-700">
                            {criticalItems}
                        </h2>
                    </div>

                    <div className="rounded-3xl border border-cyan-200 bg-cyan-50/50 p-6 shadow-sm dark:border-cyan-500/20 dark:bg-cyan-500/10 print:border-cyan-300 print:bg-cyan-50">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 print:text-slate-700">
                            Reorder Required
                        </p>

                        <h2 className="mt-2 text-3xl font-bold text-cyan-600 dark:text-cyan-400 print:text-cyan-700">
                            Yes
                        </h2>
                    </div>

                </div>

                {/* Search (Hidden in Print) */}
                <div className="no-print mb-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <Search size={18} className="text-slate-400 dark:text-slate-500" />

                    <input
                        type="text"
                        placeholder="Search product or category..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-transparent text-slate-900 placeholder-slate-400 outline-none dark:text-white dark:placeholder-slate-500"
                    />
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 print:border-slate-300 print:bg-white">

                    <div className="border-b border-slate-200 p-5 dark:border-slate-800 print:border-slate-300">
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 print:text-black">
                            Low Stock Products
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">

                            <thead className="bg-slate-100 dark:bg-slate-800/60 print:bg-slate-100">
                                <tr className="text-slate-600 dark:text-slate-300 print:text-slate-800">
                                    <th className="px-6 py-4 text-left font-semibold">
                                        Product
                                    </th>

                                    <th className="px-6 py-4 text-left font-semibold">
                                        Category
                                    </th>

                                    <th className="px-6 py-4 text-left font-semibold">
                                        Current Stock
                                    </th>

                                    <th className="px-6 py-4 text-left font-semibold">
                                        Minimum Stock
                                    </th>

                                    <th className="px-6 py-4 text-left font-semibold">
                                        Status
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredItems.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-b border-slate-200 dark:border-slate-800 print:border-slate-300"
                                    >
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100 print:text-black">
                                            {item.product}
                                        </td>

                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 print:text-slate-700">
                                            {item.category}
                                        </td>

                                        <td className="px-6 py-4 font-semibold text-rose-600 dark:text-rose-400 print:text-rose-700">
                                            {item.stock} {item.unit}
                                        </td>

                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 print:text-slate-700">
                                            {item.minStock} {item.unit}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 print:bg-rose-100 print:text-rose-800">
                                                <AlertTriangle size={14} />
                                                Low Stock
                                            </span>
                                        </td>
                                    </tr>
                                ))}

                                {filteredItems.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="py-10 text-center text-slate-500 dark:text-slate-400"
                                        >
                                            No products found
                                        </td>
                                    </tr>
                                )}
                            </tbody>

                        </table>
                    </div>

                </div>
            </div>
        </div>
    );
}
