
import { useState } from "react";
import { Link } from "react-router-dom";
import { useExpense } from "../../context/ExpenseContext";

export default function Miscellaneous() {
    const [formData, setFormData] = useState({
        category: "Office Supplies",
        amount: "",
        vendor: "",
        expenseDate: new Date().toISOString().split("T")[0],
        description: "",
        paymentMode: "Cash",
    });

    const {
        miscExpenses,
        setMiscExpenses,
    } = useExpense();

    const expenses = miscExpenses;
    const setExpenses = setMiscExpenses;

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.amount) {
            alert("Please enter expense amount");
            return;
        }

        const newExpense = {
            id: Date.now(),
            ...formData,
        };

        setExpenses((prev) => [newExpense, ...prev]);

        alert("Expense Added Successfully!");

        setFormData({
            category: "Office Supplies",
            amount: "",
            vendor: "",
            expenseDate:
                new Date().toISOString().split("T")[0],
            description: "",
            paymentMode: "Cash",
        });
    };

    const totalExpense = expenses.reduce(
        (sum, item) =>
            sum + Number(item.amount || 0),
        0
    );

    const officeSuppliesTotal = expenses
        .filter(
            (item) =>
                item.category === "Office Supplies"
        )
        .reduce(
            (sum, item) =>
                sum + Number(item.amount),
            0
        );

    const maintenanceTotal = expenses
        .filter(
            (item) =>
                item.category ===
                "Repair & Maintenance"
        )
        .reduce(
            (sum, item) =>
                sum + Number(item.amount),
            0
        );

    const otherExpensesTotal = expenses
        .filter(
            (item) =>
                item.category !==
                "Office Supplies" &&
                item.category !==
                "Repair & Maintenance"
        )
        .reduce(
            (sum, item) =>
                sum + Number(item.amount),
            0
        );

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <div className="mx-auto max-w-7xl p-6">

                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <Link
                            to="/expenses"
                            className="text-sm text-emerald-400 hover:text-emerald-300"
                        >
                            ← Back to Expenses
                        </Link>

                        <h1 className="mt-3 text-3xl font-bold">
                            Miscellaneous Expenses
                        </h1>

                        <p className="mt-1 text-slate-400">
                            Manage office and miscellaneous
                            business expenses
                        </p>
                    </div>

                    <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 px-5 py-4">
                        <p className="text-sm text-purple-300">
                            Total Expense
                        </p>

                        <h2 className="mt-1 text-2xl font-bold text-purple-400">
                            ₹
                            {totalExpense.toLocaleString(
                                "en-IN"
                            )}
                        </h2>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">

                    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                        <h2 className="mb-5 text-xl font-semibold">
                            Add Expense
                        </h2>

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-4"
                        >
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3"
                            >
                                <option>
                                    Office Supplies
                                </option>
                                <option>
                                    Stationery
                                </option>
                                <option>
                                    Cleaning Materials
                                </option>
                                <option>
                                    Internet Charges
                                </option>
                                <option>
                                    Transportation
                                </option>
                                <option>
                                    Tea & Snacks
                                </option>
                                <option>
                                    Repair & Maintenance
                                </option>
                                <option>
                                    Other
                                </option>
                            </select>

                            <input
                                type="number"
                                name="amount"
                                placeholder="Expense Amount"
                                value={formData.amount}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3"
                            />

                            <input
                                type="text"
                                name="vendor"
                                placeholder="Vendor / Supplier"
                                value={formData.vendor}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3"
                            />

                            <input
                                type="date"
                                name="expenseDate"
                                value={formData.expenseDate}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3"
                            />

                            <select
                                name="paymentMode"
                                value={formData.paymentMode}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3"
                            >
                                <option>Cash</option>
                                <option>UPI</option>
                                <option>
                                    Bank Transfer
                                </option>
                                <option>Cheque</option>
                            </select>

                            <textarea
                                rows="4"
                                name="description"
                                placeholder="Expense Description"
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3"
                            />

                            <button
                                type="submit"
                                className="w-full rounded-xl bg-purple-500 py-3 font-semibold transition hover:bg-purple-600"
                            >
                                Save Expense
                            </button>
                        </form>
                    </div>

                    <div className="lg:col-span-2">

                        <div className="mb-6 grid gap-4 md:grid-cols-3">

                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                                <p className="text-sm text-slate-400">
                                    Office Supplies
                                </p>

                                <h3 className="mt-2 text-2xl font-bold text-cyan-400">
                                    ₹
                                    {officeSuppliesTotal.toLocaleString(
                                        "en-IN"
                                    )}
                                </h3>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                                <p className="text-sm text-slate-400">
                                    Maintenance
                                </p>

                                <h3 className="mt-2 text-2xl font-bold text-amber-400">
                                    ₹
                                    {maintenanceTotal.toLocaleString(
                                        "en-IN"
                                    )}
                                </h3>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                                <p className="text-sm text-slate-400">
                                    Other Expenses
                                </p>

                                <h3 className="mt-2 text-2xl font-bold text-rose-400">
                                    ₹
                                    {otherExpensesTotal.toLocaleString(
                                        "en-IN"
                                    )}
                                </h3>
                            </div>

                        </div>

                        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
                            <div className="border-b border-slate-800 p-5">
                                <h2 className="text-xl font-semibold">
                                    Expense History
                                </h2>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-800">
                                        <tr>
                                            <th className="px-4 py-3 text-left">
                                                Date
                                            </th>
                                            <th className="px-4 py-3 text-left">
                                                Category
                                            </th>
                                            <th className="px-4 py-3 text-left">
                                                Vendor
                                            </th>
                                            <th className="px-4 py-3 text-left">
                                                Payment
                                            </th>
                                            <th className="px-4 py-3 text-right">
                                                Amount
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {expenses.map((expense) => (
                                            <tr
                                                key={expense.id}
                                                className="border-t border-slate-800"
                                            >
                                                <td className="px-4 py-3">
                                                    {
                                                        expense.expenseDate
                                                    }
                                                </td>

                                                <td className="px-4 py-3">
                                                    {expense.category}
                                                </td>

                                                <td className="px-4 py-3">
                                                    {expense.vendor ||
                                                        "-"}
                                                </td>

                                                <td className="px-4 py-3">
                                                    {
                                                        expense.paymentMode
                                                    }
                                                </td>

                                                <td className="px-4 py-3 text-right font-semibold text-rose-400">
                                                    ₹
                                                    {Number(
                                                        expense.amount
                                                    ).toLocaleString(
                                                        "en-IN"
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

