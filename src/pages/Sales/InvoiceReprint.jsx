
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

/* =========================================================
   HELPERS
   ========================================================= */

const formatCurrency = (value = 0) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);

const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const getInvoiceNumber = (sale) =>
    sale?.invoice ||
    sale?.invoiceNo ||
    sale?.invoiceNumber ||
    sale?.billNo ||
    sale?.id ||
    "INV-000";

const getCustomerName = (sale) =>
    sale?.customer ||
    sale?.customerName ||
    sale?.customer?.name ||
    "Walk-in Customer";

const getSaleDate = (sale) =>
    sale?.date ||
    sale?.saleDate ||
    sale?.createdAt ||
    sale?.createdDate ||
    "";

const getItems = (sale) => {
    if (Array.isArray(sale?.items)) {
        return sale.items;
    }

    if (Array.isArray(sale?.products)) {
        return sale.products;
    }

    return [];
};

const getItemQuantity = (item) =>
    Number(item?.quantity ?? item?.qty ?? 1);

const getItemPrice = (item) =>
    Number(
        item?.salesPrice ??
        item?.sellingPrice ??
        item?.price ??
        item?.rate ??
        0
    );

const getItemGST = (item) =>
    Number(item?.gst ?? item?.gstPercent ?? item?.tax ?? 0);

const calculateItem = (item) => {
    const quantity = getItemQuantity(item);
    const price = getItemPrice(item);
    const gst = getItemGST(item);

    const amount = quantity * price;
    const gstAmount = (amount * gst) / 100;

    return {
        amount,
        gstAmount,
        total: amount + gstAmount,
    };
};

const calculateSaleTotals = (sale) => {
    const items = getItems(sale);

    if (!items.length) {
        return {
            subtotal: Number(sale?.subtotal) || 0,
            gst: Number(sale?.gst) || 0,
            total: Number(sale?.total) || 0,
        };
    }

    const calculated = items.reduce(
        (acc, item) => {
            const itemTotal = calculateItem(item);

            acc.subtotal += itemTotal.amount;
            acc.gst += itemTotal.gstAmount;
            acc.total += itemTotal.total;

            return acc;
        },
        {
            subtotal: 0,
            gst: 0,
            total: 0,
        }
    );

    /*
      If the Sales Entry already saved exact totals,
      prefer those values when available.
    */
    return {
        subtotal:
            sale?.subtotal !== undefined
                ? Number(sale.subtotal) || 0
                : calculated.subtotal,

        gst:
            sale?.gst !== undefined
                ? Number(sale.gst) || 0
                : calculated.gst,

        total:
            sale?.total !== undefined
                ? Number(sale.total) || 0
                : calculated.total,
    };
};

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
            strokeWidth="1.8"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-4.35-4.35m1.85-5.4a7.25 7.25 0 1 1-14.5 0 7.25 7.25 0 0 1 14.5 0Z"
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

function PrinterIcon() {
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
                d="M6.75 9V4.5h10.5V9"
            />

            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18H4.5A1.5 1.5 0 0 1 3 16.5v-6A1.5 1.5 0 0 1 4.5 9h15a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5H18"
            />

            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 14.25h12V21H6v-6.75Z"
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
            strokeWidth="1.8"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m6 6 12 12M18 6 6 18"
            />
        </svg>
    );
}

/* =========================================================
   INVOICE TOTALS
   ========================================================= */

function InvoiceTotals({ sale }) {
    const totals = calculateSaleTotals(sale);

    return (
        <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                    Subtotal
                </span>

                <span className="font-medium">
                    {formatCurrency(totals.subtotal)}
                </span>
            </div>

            <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                    GST
                </span>

                <span className="font-medium">
                    {formatCurrency(totals.gst)}
                </span>
            </div>

            <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
                <div className="flex items-center justify-between">
                    <span className="text-base font-bold">
                        Total
                    </span>

                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(totals.total)}
                    </span>
                </div>
            </div>
        </div>
    );
}

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export default function InvoiceReprint() {
    const [salesData, setSalesData] = useState([]);
    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [selectedSale, setSelectedSale] = useState(null);

    /* =======================================================
       LOAD SALES FROM LOCAL STORAGE
       ======================================================= */

    useEffect(() => {
        const loadSales = () => {
            try {
                const savedSales =
                    JSON.parse(
                        localStorage.getItem("salesHistory")
                    ) || [];

                if (Array.isArray(savedSales)) {
                    setSalesData(savedSales);
                } else {
                    setSalesData([]);
                }
            } catch (error) {
                console.error(
                    "Failed to load sales history:",
                    error
                );

                setSalesData([]);
            }
        };

        loadSales();

        window.addEventListener(
            "storage",
            loadSales
        );

        return () => {
            window.removeEventListener(
                "storage",
                loadSales
            );
        };
    }, []);

    /* =======================================================
       FILTER SALES
       ======================================================= */

    const filteredSales = useMemo(() => {
        const query = search.trim().toLowerCase();

        return salesData.filter((sale) => {
            const invoice = getInvoiceNumber(sale)
                .toString()
                .toLowerCase();

            const customer = getCustomerName(sale)
                .toString()
                .toLowerCase();

            const saleDate = getSaleDate(sale);

            const matchesSearch =
                !query ||
                invoice.includes(query) ||
                customer.includes(query);

            let matchesDate = true;

            if (dateFilter) {
                if (!saleDate) {
                    matchesDate = false;
                } else {
                    const date = new Date(saleDate);

                    if (Number.isNaN(date.getTime())) {
                        matchesDate = false;
                    } else {
                        const localDate =
                            date.toISOString().split("T")[0];

                        matchesDate =
                            localDate === dateFilter ||
                            String(saleDate).startsWith(
                                dateFilter
                            );
                    }
                }
            }

            return matchesSearch && matchesDate;
        });
    }, [salesData, search, dateFilter]);

    /* =======================================================
       PRINT INVOICE
       ======================================================= */

    const handlePrint = (sale) => {
        setSelectedSale(sale);

        setTimeout(() => {
            window.print();
        }, 150);
    };

    /* =======================================================
       RENDER
       ======================================================= */

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">

                {/* =================================================
            HEADER
            ================================================= */}

                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Link
                            to="/sales"
                            className="mb-2 inline-flex text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
                        >
                            ← Back to Sales
                        </Link>

                        <h1 className="text-2xl font-bold sm:text-3xl">
                            Invoice Reprint
                        </h1>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Search previous sales invoices and
                            print them again.
                        </p>
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                        <p className="text-xs font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                            Available Invoices
                        </p>

                        <p className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-300">
                            {filteredSales.length}
                        </p>
                    </div>
                </div>
                <section className="mb-6 rounded-2xl border border-slate-800/60 bg-slate-900/80 p-4 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row">

                        <div className="relative flex-1">
                            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <SearchIcon />
                            </div>

                            <input
                                type="text"
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                                placeholder="Search invoice number, customer..."
                                className="w-full rounded-xl border border-slate-800/60 bg-slate-900/80 py-3 pl-12 pr-4 text-sm text-slate-200 placeholder:text-slate-500 outline-none transition focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20"
                            />
                        </div>

                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) =>
                                setDateFilter(e.target.value)
                            }
                            className="rounded-xl border border-slate-800/60 bg-slate-950/40 px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                        />

                        {(search || dateFilter) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch("");
                                    setDateFilter("");
                                }}
                                className="rounded-xl border border-slate-800/60 bg-slate-950/40 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </section>

                {/* =================================================
            INVOICE LIST
            ================================================= */}

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

                    <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                        <h2 className="font-semibold">
                            Previous Invoices
                        </h2>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Select an invoice to view or reprint.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/60">
                                <tr>
                                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Invoice
                                    </th>

                                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Date
                                    </th>

                                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Customer
                                    </th>

                                    <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Items
                                    </th>

                                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Total
                                    </th>

                                    <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

                                {filteredSales.map((sale, index) => {
                                    const items = getItems(sale);
                                    const totals =
                                        calculateSaleTotals(sale);

                                    return (
                                        <tr
                                            key={
                                                sale.id ||
                                                getInvoiceNumber(sale) ||
                                                index
                                            }
                                            className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                        >
                                            <td className="px-5 py-4">
                                                <span className="font-semibold">
                                                    {getInvoiceNumber(sale)}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                                                {formatDate(
                                                    getSaleDate(sale)
                                                )}
                                            </td>

                                            <td className="px-5 py-4 text-sm font-medium">
                                                {getCustomerName(sale)}
                                            </td>

                                            <td className="px-5 py-4 text-center text-sm">
                                                {items.length}
                                            </td>

                                            <td className="px-5 py-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                                {formatCurrency(
                                                    totals.total
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-center gap-2">

                                                    {/* VIEW */}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedSale(sale)
                                                        }
                                                        title="View Invoice"
                                                        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500 dark:border-slate-700"
                                                    >
                                                        <EyeIcon />
                                                    </button>

                                                    {/* PRINT */}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handlePrint(sale)
                                                        }
                                                        title="Print Invoice"
                                                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                                                    >
                                                        <PrinterIcon />
                                                        Print
                                                    </button>

                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                            </tbody>
                        </table>
                    </div>

                    {/* EMPTY STATE */}

                    {filteredSales.length === 0 && (
                        <div className="px-6 py-16 text-center">
                            <p className="font-semibold">
                                No invoices found
                            </p>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Create a sales entry first, then
                                the invoice will appear here.
                            </p>
                        </div>
                    )}
                </section>
            </div>

            {/* =====================================================
          VIEW INVOICE MODAL
          ===================================================== */}

            {selectedSale && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm print:hidden"
                    onClick={() =>
                        setSelectedSale(null)
                    }
                >
                    <div
                        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* MODAL HEADER */}

                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-slate-500">
                                    Invoice
                                </p>

                                <h2 className="text-2xl font-bold">
                                    {getInvoiceNumber(
                                        selectedSale
                                    )}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedSale(null)
                                }
                                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        {/* CUSTOMER INFORMATION */}

                        <div className="mt-6 grid gap-4 sm:grid-cols-3">

                            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                                <p className="text-xs text-slate-500">
                                    Customer
                                </p>

                                <p className="mt-1 font-semibold">
                                    {getCustomerName(
                                        selectedSale
                                    )}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                                <p className="text-xs text-slate-500">
                                    Invoice Date
                                </p>

                                <p className="mt-1 font-semibold">
                                    {formatDate(
                                        getSaleDate(
                                            selectedSale
                                        )
                                    )}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                                <p className="text-xs text-slate-500">
                                    Payment
                                </p>

                                <p className="mt-1 font-semibold">
                                    {selectedSale.payment ||
                                        selectedSale.paymentMethod ||
                                        "Paid"}
                                </p>
                            </div>

                        </div>

                        {/* PRODUCTS */}

                        <div className="mt-6">
                            <h3 className="mb-3 font-semibold">
                                Products
                            </h3>

                            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                                <table className="w-full min-w-[600px] text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800">
                                        <tr>
                                            <th className="px-4 py-3 text-xs uppercase text-slate-500">
                                                Product
                                            </th>

                                            <th className="px-4 py-3 text-center text-xs uppercase text-slate-500">
                                                Qty
                                            </th>

                                            <th className="px-4 py-3 text-right text-xs uppercase text-slate-500">
                                                Price
                                            </th>

                                            <th className="px-4 py-3 text-center text-xs uppercase text-slate-500">
                                                GST
                                            </th>

                                            <th className="px-4 py-3 text-right text-xs uppercase text-slate-500">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">

                                        {getItems(
                                            selectedSale
                                        ).map((item, index) => {
                                            const calculated =
                                                calculateItem(item);

                                            return (
                                                <tr
                                                    key={
                                                        item.id ||
                                                        index
                                                    }
                                                >
                                                    <td className="px-4 py-3 font-medium">
                                                        {item.product ||
                                                            item.name ||
                                                            "Product"}
                                                    </td>

                                                    <td className="px-4 py-3 text-center">
                                                        {getItemQuantity(
                                                            item
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3 text-right">
                                                        {formatCurrency(
                                                            getItemPrice(
                                                                item
                                                            )
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3 text-center">
                                                        {getItemGST(item)}%
                                                    </td>

                                                    <td className="px-4 py-3 text-right font-semibold">
                                                        {formatCurrency(
                                                            calculated.total
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* TOTALS */}

                        <div className="mt-6 ml-auto max-w-sm rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                            <InvoiceTotals
                                sale={selectedSale}
                            />
                        </div>

                        {/* BUTTONS */}

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedSale(null)
                                }
                                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Close
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    handlePrint(selectedSale)
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
                            >
                                <PrinterIcon />
                                Print Invoice
                            </button>

                        </div>
                    </div>
                </div>
            )}

            {/* =====================================================
          PRINT ONLY INVOICE
          ===================================================== */}

            {selectedSale && (
                <div className="hidden print:block">
                    <div className="mx-auto max-w-3xl bg-white p-8 text-black">

                        <div className="flex items-start justify-between border-b border-black pb-5">
                            <div>
                                <h1 className="text-2xl font-bold">
                                    Gupta Traders
                                </h1>

                                <p className="mt-1 text-sm">
                                    Sales Invoice
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="text-sm">
                                    Invoice No:
                                </p>

                                <p className="font-bold">
                                    {getInvoiceNumber(
                                        selectedSale
                                    )}
                                </p>

                                <p className="mt-1 text-sm">
                                    Date:{" "}
                                    {formatDate(
                                        getSaleDate(
                                            selectedSale
                                        )
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5">
                            <p className="text-sm">
                                Customer:
                            </p>

                            <p className="font-semibold">
                                {getCustomerName(
                                    selectedSale
                                )}
                            </p>
                        </div>

                        <table className="mt-6 w-full border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-black">
                                    <th className="px-2 py-3 text-left">
                                        Product
                                    </th>

                                    <th className="px-2 py-3 text-center">
                                        Qty
                                    </th>

                                    <th className="px-2 py-3 text-right">
                                        Price
                                    </th>

                                    <th className="px-2 py-3 text-center">
                                        GST
                                    </th>

                                    <th className="px-2 py-3 text-right">
                                        Total
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {getItems(
                                    selectedSale
                                ).map((item, index) => {
                                    const calculated =
                                        calculateItem(item);

                                    return (
                                        <tr
                                            key={
                                                item.id ||
                                                index
                                            }
                                            className="border-b border-gray-300"
                                        >
                                            <td className="px-2 py-3">
                                                {item.product ||
                                                    item.name ||
                                                    "Product"}
                                            </td>

                                            <td className="px-2 py-3 text-center">
                                                {getItemQuantity(
                                                    item
                                                )}
                                            </td>

                                            <td className="px-2 py-3 text-right">
                                                {formatCurrency(
                                                    getItemPrice(item)
                                                )}
                                            </td>

                                            <td className="px-2 py-3 text-center">
                                                {getItemGST(item)}%
                                            </td>

                                            <td className="px-2 py-3 text-right">
                                                {formatCurrency(
                                                    calculated.total
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        <div className="mt-6 ml-auto max-w-xs">
                            <InvoiceTotals
                                sale={selectedSale}
                            />
                        </div>

                        <div className="mt-10 border-t border-black pt-4 text-center text-sm">
                            Thank you for your business!
                        </div>

                    </div>
                </div>
            )}

            {/* =====================================================
          PRINT STYLES
          ===================================================== */}

            <style>{`
        @media print {
          body {
            background: white !important;
          }

          body * {
            visibility: hidden;
          }

          .print\\:block,
          .print\\:block * {
            visibility: visible;
          }

          .print\\:block {
            position: absolute;
            inset: 0;
            width: 100%;
            background: white;
          }

          @page {
            margin: 12mm;
          }
        }
      `}</style>
        </div>
    );
}
