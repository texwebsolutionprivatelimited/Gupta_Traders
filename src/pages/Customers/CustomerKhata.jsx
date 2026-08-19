
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search,
    ArrowDownLeft,
    ArrowUpRight,
    Wallet,
    UserRound,
    Phone,
    CalendarDays,
    Plus,
    IndianRupee,
} from "lucide-react";

const initialKhata = [
    {
        id: 1,
        customerId: 1,
        customer: "Ramesh Kumar",
        mobile: "9876543210",
        openingBalance: 2000,
        transactions: [
            {
                id: 1,
                date: "2026-08-01",
                type: "Purchase",
                description: "Grocery Purchase",
                debit: 3500,
                credit: 0,
            },
            {
                id: 2,
                date: "2026-08-05",
                type: "Payment",
                description: "Cash Payment",
                debit: 0,
                credit: 1000,
            },
            {
                id: 3,
                date: "2026-08-12",
                type: "Purchase",
                description: "Monthly Grocery",
                debit: 2500,
                credit: 0,
            },
        ],
    },
    {
        id: 2,
        customerId: 2,
        customer: "Amit Sharma",
        mobile: "9123456780",
        openingBalance: 1000,
        transactions: [
            {
                id: 1,
                date: "2026-08-03",
                type: "Purchase",
                description: "Rice and Pulses",
                debit: 3000,
                credit: 0,
            },
            {
                id: 2,
                date: "2026-08-10",
                type: "Payment",
                description: "UPI Payment",
                debit: 0,
                credit: 1500,
            },
        ],
    },
    {
        id: 3,
        customerId: 3,
        customer: "Suresh Verma",
        mobile: "9988776655",
        openingBalance: 3500,
        transactions: [
            {
                id: 1,
                date: "2026-08-02",
                type: "Purchase",
                description: "Household Items",
                debit: 5000,
                credit: 0,
            },
            {
                id: 2,
                date: "2026-08-09",
                type: "Payment",
                description: "Cash Payment",
                debit: 0,
                credit: 2000,
            },
        ],
    },
];

export default function CustomerKhata() {
    const navigate = useNavigate();

    const [khataData, setKhataData] = useState(() => {
        try {
            const saved = localStorage.getItem("customerKhata");

            if (saved) {
                const parsed = JSON.parse(saved);

                if (Array.isArray(parsed)) {
                    return parsed;
                }
            }
        } catch (error) {
            console.error("Failed to load customer khata:", error);
        }

        return initialKhata;
    });

    const [selectedCustomerId, setSelectedCustomerId] =
        useState(1);

    const [search, setSearch] = useState("");

    const selectedCustomer = khataData.find(
        (item) =>
            item.customerId === Number(selectedCustomerId)
    );

    const filteredCustomers = useMemo(() => {
        return khataData.filter((item) => {
            const value = search.toLowerCase();

            return (
                item.customer.toLowerCase().includes(value) ||
                item.mobile.includes(search)
            );
        });
    }, [khataData, search]);

    const getTotals = (customer) => {
        if (!customer) {
            return {
                debit: 0,
                credit: 0,
                balance: 0,
            };
        }

        const debit = customer.transactions.reduce(
            (sum, transaction) =>
                sum + Number(transaction.debit || 0),
            0
        );

        const credit = customer.transactions.reduce(
            (sum, transaction) =>
                sum + Number(transaction.credit || 0),
            0
        );

        const balance =
            Number(customer.openingBalance || 0) +
            debit -
            credit;

        return {
            debit,
            credit,
            balance,
        };
    };

    const totals = getTotals(selectedCustomer);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(Number(amount || 0));
    };

    const addPayment = () => {
        if (!selectedCustomer) return;

        const amount = window.prompt(
            `Enter payment received from ${selectedCustomer.customer}:`
        );

        if (!amount) return;

        const paymentAmount = Number(amount);

        if (
            !Number.isFinite(paymentAmount) ||
            paymentAmount <= 0
        ) {
            alert("Please enter a valid payment amount.");
            return;
        }

        const updatedData = khataData.map((customer) => {
            if (
                customer.customerId !==
                selectedCustomer.customerId
            ) {
                return customer;
            }

            return {
                ...customer,
                transactions: [
                    ...customer.transactions,
                    {
                        id: Date.now(),
                        date: new Date()
                            .toISOString()
                            .split("T")[0],
                        type: "Payment",
                        description: "Payment Received",
                        debit: 0,
                        credit: paymentAmount,
                    },
                ],
            };
        });

        setKhataData(updatedData);

        localStorage.setItem(
            "customerKhata",
            JSON.stringify(updatedData)
        );
    };

    return (
        <div className="min-h-full bg-slate-50 p-4 text-slate-900 dark:bg-slate-950 dark:text-white sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">

                {/* Header */}

                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <span>Customers</span>
                            <span>/</span>
                            <span className="text-emerald-500">
                                Customer Khata
                            </span>
                        </div>

                        <h1 className="text-2xl font-bold sm:text-3xl">
                            Customer Khata
                        </h1>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Track customer credit, purchases and payments.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">

                        <button
                            type="button"
                            onClick={() =>
                                navigate("/customers/list")
                            }
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                        >
                            Customer List
                        </button>

                        <button
                            type="button"
                            onClick={addPayment}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600"
                        >
                            <Plus size={18} />
                            Add Payment
                        </button>

                    </div>
                </div>

                {/* Customer Selector */}

                <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

                    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">

                        <div className="relative">

                            <Search
                                size={18}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                                placeholder="Search customer by name or mobile..."
                                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800"
                            />

                        </div>

                        <select
                            value={selectedCustomerId}
                            onChange={(e) =>
                                setSelectedCustomerId(
                                    Number(e.target.value)
                                )
                            }
                            className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800"
                        >
                            {filteredCustomers.map((customer) => (
                                <option
                                    key={customer.customerId}
                                    value={customer.customerId}
                                >
                                    {customer.customer} - {customer.mobile}
                                </option>
                            ))}
                        </select>

                    </div>
                </div>

                {/* Customer Profile */}

                {selectedCustomer && (
                    <>
                        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

                            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                                <div className="flex items-center gap-4">

                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-bold text-white">
                                        {selectedCustomer.customer
                                            .split(" ")
                                            .slice(0, 2)
                                            .map((word) => word[0])
                                            .join("")
                                            .toUpperCase()}
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-bold">
                                            {selectedCustomer.customer}
                                        </h2>

                                        <div className="mt-1 flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">

                                            <span className="inline-flex items-center gap-1.5">
                                                <Phone size={14} />
                                                {selectedCustomer.mobile}
                                            </span>

                                            <span className="inline-flex items-center gap-1.5">
                                                <UserRound size={14} />
                                                Customer Account
                                            </span>

                                        </div>
                                    </div>

                                </div>

                                <div className="rounded-xl bg-rose-500/10 px-5 py-3">
                                    <p className="text-xs font-medium uppercase tracking-wide text-rose-500">
                                        Current Due
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-rose-500">
                                        {formatCurrency(totals.balance)}
                                    </p>
                                </div>

                            </div>
                        </div>

                        {/* Summary */}

                        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                            <KhataCard
                                title="Opening Balance"
                                value={formatCurrency(
                                    selectedCustomer.openingBalance
                                )}
                                icon={<Wallet size={20} />}
                            />

                            <KhataCard
                                title="Total Purchase"
                                value={formatCurrency(totals.debit)}
                                icon={<ArrowDownLeft size={20} />}
                            />

                            <KhataCard
                                title="Total Payment"
                                value={formatCurrency(totals.credit)}
                                icon={<ArrowUpRight size={20} />}
                            />

                            <KhataCard
                                title="Current Due"
                                value={formatCurrency(totals.balance)}
                                icon={<IndianRupee size={20} />}
                                danger={totals.balance > 0}
                            />

                        </div>

                        {/* Transaction History */}

                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

                            <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">

                                <div>
                                    <h2 className="text-lg font-semibold">
                                        Khata Transactions
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        Complete credit and payment history.
                                    </p>
                                </div>

                                <div className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                    <CalendarDays size={16} />
                                    {selectedCustomer.transactions.length} Transactions
                                </div>

                            </div>

                            <div className="overflow-x-auto">

                                <table className="w-full min-w-[850px]">

                                    <thead className="bg-slate-50 dark:bg-slate-800/60">

                                        <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">

                                            <th className="px-5 py-4">
                                                Date
                                            </th>

                                            <th className="px-5 py-4">
                                                Type
                                            </th>

                                            <th className="px-5 py-4">
                                                Description
                                            </th>

                                            <th className="px-5 py-4 text-right">
                                                Debit
                                            </th>

                                            <th className="px-5 py-4 text-right">
                                                Credit
                                            </th>

                                            <th className="px-5 py-4 text-right">
                                                Balance
                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">

                                        {(() => {
                                            let runningBalance =
                                                Number(
                                                    selectedCustomer.openingBalance ||
                                                    0
                                                );

                                            return selectedCustomer.transactions.map(
                                                (transaction) => {
                                                    runningBalance +=
                                                        Number(transaction.debit || 0);

                                                    runningBalance -=
                                                        Number(transaction.credit || 0);

                                                    return (
                                                        <tr
                                                            key={transaction.id}
                                                            className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                                        >

                                                            <td className="px-5 py-4 text-sm">
                                                                {transaction.date}
                                                            </td>

                                                            <td className="px-5 py-4">

                                                                <span
                                                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${transaction.type ===
                                                                            "Payment"
                                                                            ? "bg-emerald-500/10 text-emerald-500"
                                                                            : "bg-amber-500/10 text-amber-500"
                                                                        }`}
                                                                >
                                                                    {transaction.type}
                                                                </span>

                                                            </td>

                                                            <td className="px-5 py-4 text-sm">
                                                                {transaction.description}
                                                            </td>

                                                            <td className="px-5 py-4 text-right font-semibold text-rose-500">
                                                                {transaction.debit
                                                                    ? formatCurrency(
                                                                        transaction.debit
                                                                    )
                                                                    : "-"}
                                                            </td>

                                                            <td className="px-5 py-4 text-right font-semibold text-emerald-500">
                                                                {transaction.credit
                                                                    ? formatCurrency(
                                                                        transaction.credit
                                                                    )
                                                                    : "-"}
                                                            </td>

                                                            <td className="px-5 py-4 text-right font-bold">
                                                                {formatCurrency(
                                                                    runningBalance
                                                                )}
                                                            </td>

                                                        </tr>
                                                    );
                                                }
                                            );
                                        })()}

                                    </tbody>

                                </table>

                            </div>

                        </div>
                    </>
                )}

            </div>
        </div>
    );
}

/* =========================================================
   KHATA CARD
========================================================= */

function KhataCard({
    title,
    value,
    icon,
    danger = false,
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

            <div className="flex items-start justify-between gap-4">

                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {title}
                    </p>

                    <p
                        className={`mt-2 text-2xl font-bold ${danger
                                ? "text-rose-500"
                                : "text-slate-900 dark:text-white"
                            }`}
                    >
                        {value}
                    </p>
                </div>

                <div
                    className={`rounded-xl p-3 ${danger
                            ? "bg-rose-500/10 text-rose-500"
                            : "bg-emerald-500/10 text-emerald-500"
                        }`}
                >
                    {icon}
                </div>

            </div>

        </div>
    );
}
