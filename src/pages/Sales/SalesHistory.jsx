
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number(value) || 0);

/* =========================================================
   ICONS
   ========================================================= */

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

function SalesIcon() {
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
                d="M4 19h16M7 15l4-4 3 3 5-7"
            />
        </svg>
    );
}

function CloseIcon() {
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
                d="M6 6l12 12M18 6 6 18"
            />
        </svg>
    );
}

/* =========================================================
   BADGES
   ========================================================= */

function StatusBadge({ status }) {
    const styles = {
        Completed:
            "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",

        Pending:
            "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",

        Returned:
            "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400",
    };

    const currentStyle =
        styles[status] ||
        "border-slate-500/20 bg-slate-500/10 text-slate-500 dark:text-slate-400";

    return (
        <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${currentStyle}`}
        >
            {status || "Unknown"}
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

        Partial:
            "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    };

    const currentStyle =
        styles[payment] ||
        "bg-slate-500/10 text-slate-500 dark:text-slate-400";

    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${currentStyle}`}
        >
            {payment || "Unknown"}
        </span>
    );
}

/* =========================================================
   CARD
   ========================================================= */

function Card({ title, value, valueClass = "" }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70">
            <p className="text-sm text-slate-500 dark:text-slate-400">
                {title}
            </p>

            <p
                className={`mt-2 text-2xl font-bold text-slate-900 dark:text-white ${valueClass}`}
            >
                {value}
            </p>
        </div>
    );
}

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export default function SalesHistory() {
    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [paymentFilter, setPaymentFilter] = useState("All");
    const [selectedSale, setSelectedSale] = useState(null);
    const [salesData, setSalesData] = useState([]);
    /* =======================================================
       LOAD SALES FROM LOCAL STORAGE
       ======================================================= */

    useEffect(() => {
        try {
            const savedSales =
                JSON.parse(localStorage.getItem("salesHistory")) || [];

            setSalesData(Array.isArray(savedSales) ? savedSales : []);
        } catch (error) {
            console.error("Failed to load sales history:", error);
            setSalesData([]);
        }
    }, []);

    /* =======================================================
       FILTER SALES
       ======================================================= */

    const filteredSales = useMemo(() => {
        const query = search.trim().toLowerCase();

        return salesData.filter((sale) => {
            const saleId = String(sale?.id || "").toLowerCase();
            const customer = String(
                sale?.customer || ""
            ).toLowerCase();
            const invoice = String(
                sale?.invoice || ""
            ).toLowerCase();

            const matchesSearch =
                !query ||
                saleId.includes(query) ||
                customer.includes(query) ||
                invoice.includes(query);

            const matchesStatus =
                statusFilter === "All" ||
                sale?.status === statusFilter;

            const matchesPayment =
                paymentFilter === "All" ||
                sale?.payment === paymentFilter;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesPayment
            );
        });
    }, [
        salesData,
        search,
        statusFilter,
        paymentFilter,
    ]);

    /* =======================================================
       SUMMARY
       ======================================================= */

    const totalSalesAmount = filteredSales.reduce(
        (sum, sale) => sum + (Number(sale?.total) || 0),
        0
    );

    const completedCount = filteredSales.filter(
        (sale) => sale?.status === "Completed"
    ).length;

    const pendingCount = filteredSales.filter(
        (sale) => sale?.status === "Pending"
    ).length;

    /* =======================================================
       ITEM COUNT
       ======================================================= */

    const getItemCount = (sale) => {
        if (Array.isArray(sale?.items)) {
            return sale.items.length;
        }

        return Number(sale?.itemCount) || 0;
    };

    /* =======================================================
       DOWNLOAD INVOICE
       ======================================================= */

    const handleDownload = (sale) => {
        if (!sale) return;

        const invoiceNumber =
            sale.invoice || sale.id || "invoice";

        alert(`Downloading invoice ${invoiceNumber}`);
    };

    /* =======================================================
       CLOSE MODAL
       ======================================================= */

    const closeModal = () => {
        setSelectedSale(null);
    };

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">

                {/* =================================================
            HEADER
            ================================================= */}

                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">

                            <Link
                                to="/sales"
                                className="transition hover:text-emerald-500"
                            >
                                Sales
                            </Link>

                            <span>/</span>

                            <span>Sales History</span>
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            Sales History
                        </h1>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            View and manage all your sales transactions.
                        </p>
                    </div>

                    <Link
                        to="/sales"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600"
                    >
                        <SalesIcon />
                        New Sale
                    </Link>
                </div>

                {/* =================================================
            SUMMARY CARDS
            ================================================= */}

                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    <Card
                        title="Total Sales"
                        value={filteredSales.length}
                    />

                    <Card
                        title="Sales Amount"
                        value={formatCurrency(totalSalesAmount)}
                        valueClass="text-emerald-600 dark:text-emerald-400"
                    />

                    <Card
                        title="Completed"
                        value={completedCount}
                        valueClass="text-blue-600 dark:text-blue-400"
                    />

                    <Card
                        title="Pending"
                        value={pendingCount}
                        valueClass="text-amber-600 dark:text-amber-400"
                    />
                </div>

                {/* =================================================
            FILTER SECTION
            ================================================= */}

                <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                    {/* Filters */}
                    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">

                            {/* Search */}
                            <div className="relative flex-1">
                                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <SearchIcon />
                                </div>

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search sales ID, customer or invoice..."
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            </div>

                            {/* Status Filter */}
                            <div className="flex items-center gap-2">
                                <FilterIcon />

                                <select
                                    value={statusFilter}
                                    onChange={(e) =>
                                        setStatusFilter(e.target.value)
                                    }
                                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                >
                                    <option value="All">All Status</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Returned">Returned</option>
                                </select>
                            </div>

                            {/* Payment Filter */}
                            <select
                                value={paymentFilter}
                                onChange={(e) =>
                                    setPaymentFilter(e.target.value)
                                }
                                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            >
                                <option value="All">All Payments</option>
                                <option value="Paid">Paid</option>
                                <option value="Pending">Pending</option>
                                <option value="Refunded">Refunded</option>
                            </select>
                        </div>
                    </div>

                    {/* Desktop Sales Table */}
                    <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70 md:block">

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1050px]">

                                <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60">
                                    <tr>
                                        <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Sale
                                        </th>

                                        <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Date
                                        </th>

                                        <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Customer
                                        </th>

                                        <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Invoice
                                        </th>

                                        <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Items
                                        </th>

                                        <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Total
                                        </th>

                                        <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Payment
                                        </th>

                                        <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Status
                                        </th>

                                        <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

                                    {filteredSales.map((sale) => (

                                        <tr
                                            key={sale.id}
                                            className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                        >

                                            {/* Sale ID */}
                                            <td className="px-5 py-4">
                                                <span className="font-semibold text-slate-900 dark:text-white">
                                                    {sale.id || "-"}
                                                </span>
                                            </td>

                                            {/* Date */}
                                            <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                                                {sale.date || "-"}
                                            </td>

                                            {/* Customer */}
                                            <td className="px-5 py-4">
                                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                    {sale.customer || "Walk-in Customer"}
                                                </span>
                                            </td>

                                            {/* Invoice */}
                                            <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                                                {sale.invoice || "-"}
                                            </td>

                                            {/* Items */}
                                            <td className="px-5 py-4 text-center text-sm">
                                                {sale.itemCount ??
                                                    (Array.isArray(sale.items)
                                                        ? sale.items.length
                                                        : sale.items ?? 0)}
                                            </td>

                                            {/* Total */}
                                            <td className="px-5 py-4 text-right font-semibold">
                                                {formatCurrency(
                                                    Number(sale.total) || 0
                                                )}
                                            </td>

                                            {/* Payment */}
                                            <td className="px-5 py-4 text-center">
                                                <PaymentBadge
                                                    payment={sale.payment || "Pending"}
                                                />
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4 text-center">
                                                <StatusBadge
                                                    status={sale.status || "Pending"}
                                                />
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedSale(sale)
                                                        }
                                                        title="View Sale"
                                                        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500 dark:border-slate-700"
                                                    >
                                                        <EyeIcon />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            navigate(
                                                                `/sales/invoice-reprint?invoice=${encodeURIComponent(
                                                                    sale.invoice
                                                                )}`
                                                            )
                                                        }
                                                        className="rounded-lg p-2 text-slate-500 transition hover:bg-emerald-500/10 hover:text-emerald-500"
                                                        title="Invoice Reprint"
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

                        {filteredSales.length === 0 && (
                            <div className="px-6 py-16 text-center">
                                <p className="font-semibold text-slate-900 dark:text-white">
                                    No sales found
                                </p>

                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Try changing your search or filters.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Mobile Sales Cards */}
                    <div className="space-y-4 md:hidden">

                        {filteredSales.map((sale) => (

                            <div
                                key={sale.id}
                                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
                            >

                                <div className="flex items-start justify-between gap-3">

                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">
                                            {sale.id || "-"}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            {sale.date || "-"}
                                        </p>
                                    </div>

                                    <StatusBadge
                                        status={sale.status || "Pending"}
                                    />

                                </div>

                                <div className="mt-4 space-y-2 text-sm">

                                    <div className="flex justify-between gap-4">
                                        <span className="text-slate-500 dark:text-slate-400">
                                            Customer
                                        </span>

                                        <span className="text-right font-medium">
                                            {sale.customer || "Walk-in Customer"}
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-4">
                                        <span className="text-slate-500 dark:text-slate-400">
                                            Invoice
                                        </span>

                                        <span>
                                            {sale.invoice || "-"}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">
                                            Items
                                        </span>

                                        <span>
                                            {sale.itemCount ??
                                                (Array.isArray(sale.items)
                                                    ? sale.items.length
                                                    : sale.items ?? 0)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500 dark:text-slate-400">
                                            Payment
                                        </span>

                                        <PaymentBadge
                                            payment={sale.payment || "Pending"}
                                        />
                                    </div>

                                    <div className="flex justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                                        <span className="font-medium">
                                            Total
                                        </span>

                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(
                                                Number(sale.total) || 0
                                            )}
                                        </span>
                                    </div>

                                </div>

                                <div className="mt-4 flex gap-2">

                                    <button
                                        type="button"
                                        onClick={() => setSelectedSale(sale)}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-medium transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                                    >
                                        <EyeIcon />
                                        View
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleDownload(sale)}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-600"
                                    >
                                        <DownloadIcon />
                                        Invoice
                                    </button>

                                </div>

                            </div>
                        ))}

                        {filteredSales.length === 0 && (
                            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900">
                                <p className="font-semibold">
                                    No sales found
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                    Try changing your search or filters.
                                </p>
                            </div>
                        )}

                    </div>

                    {selectedSale && (
                        <div
                            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                            onClick={closeModal}
                        >
                            <div
                                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Modal Header */}
                                <div className="flex items-start justify-between gap-4">

                                    <div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Sale ID
                                        </p>

                                        <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                                            {selectedSale.id || "-"}
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                            Invoice: {selectedSale.invoice || "-"}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                                        aria-label="Close"
                                    >
                                        <CloseIcon />
                                    </button>
                                </div>

                                {/* Customer Information */}
                                <div className="mt-6 grid gap-4 sm:grid-cols-2">

                                    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Customer
                                        </p>

                                        <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                                            {selectedSale.customer || "Walk-in Customer"}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Invoice Number
                                        </p>

                                        <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                                            {selectedSale.invoice || "-"}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Sale Date
                                        </p>

                                        <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                                            {selectedSale.date || "-"}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Payment
                                        </p>

                                        <div className="mt-2">
                                            <PaymentBadge
                                                payment={selectedSale.payment || "Pending"}
                                            />
                                        </div>
                                    </div>

                                </div>

                                {/* Products */}
                                <div className="mt-6">

                                    <div className="mb-3 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                                Products
                                            </h3>

                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                Products included in this sale.
                                            </p>
                                        </div>

                                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            {getItemCount(selectedSale)} item(s)
                                        </span>
                                    </div>

                                    {Array.isArray(selectedSale.items) &&
                                        selectedSale.items.length > 0 ? (
                                        <div className="space-y-3">

                                            {selectedSale.items.map((item, index) => {

                                                const quantity =
                                                    Number(item?.quantity) || 0;

                                                const salesPrice =
                                                    Number(
                                                        item?.salesPrice ??
                                                        item?.sellingPrice ??
                                                        item?.price ??
                                                        0
                                                    );

                                                const gst =
                                                    Number(item?.gst) || 0;

                                                const amount =
                                                    quantity * salesPrice;

                                                const gstAmount =
                                                    (amount * gst) / 100;

                                                const itemTotal =
                                                    amount + gstAmount;

                                                return (
                                                    <div
                                                        key={item?.id || index}
                                                        className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50"
                                                    >

                                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-slate-900 dark:text-white">
                                                                    {item?.product ||
                                                                        item?.name ||
                                                                        "Product"}
                                                                </p>

                                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                                    Price: {formatCurrency(salesPrice)}
                                                                </p>
                                                            </div>

                                                            <div className="grid grid-cols-3 gap-4 text-right text-sm">

                                                                <div>
                                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                        Qty
                                                                    </p>

                                                                    <p className="mt-1 font-semibold">
                                                                        {quantity}
                                                                    </p>
                                                                </div>

                                                                <div>
                                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                        GST
                                                                    </p>

                                                                    <p className="mt-1 font-semibold">
                                                                        {gst}%
                                                                    </p>
                                                                </div>

                                                                <div>
                                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                        Total
                                                                    </p>

                                                                    <p className="mt-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                                                        {formatCurrency(itemTotal)}
                                                                    </p>
                                                                </div>

                                                            </div>

                                                        </div>

                                                    </div>
                                                );
                                            })}

                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                No product details available for this sale.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Summary */}
                                <div className="mt-6 rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/70">

                                    <h3 className="mb-4 text-lg font-semibold">
                                        Sale Summary
                                    </h3>

                                    <div className="space-y-3 text-sm">

                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500 dark:text-slate-400">
                                                Subtotal
                                            </span>

                                            <span className="font-medium">
                                                {formatCurrency(
                                                    selectedSale.subtotal
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500 dark:text-slate-400">
                                                GST
                                            </span>

                                            <span className="font-medium">
                                                {formatCurrency(
                                                    selectedSale.gst
                                                )}
                                            </span>
                                        </div>

                                        <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
                                            <div className="flex items-center justify-between">

                                                <span className="text-lg font-bold">
                                                    Total
                                                </span>

                                                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(
                                                        selectedSale.total
                                                    )}
                                                </span>

                                            </div>
                                        </div>

                                    </div>
                                </div>

                                {/* Status + Actions */}
                                <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                                    <div className="flex flex-wrap gap-2">
                                        <StatusBadge
                                            status={
                                                selectedSale.status || "Pending"
                                            }
                                        />

                                        <PaymentBadge
                                            payment={
                                                selectedSale.payment || "Pending"
                                            }
                                        />
                                    </div>

                                    <div className="flex gap-2">

                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                        >
                                            Close
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleDownload(selectedSale)
                                            }
                                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
                                        >
                                            <DownloadIcon />
                                            Download Invoice
                                        </button>

                                    </div>

                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

        </div>
    )
}
