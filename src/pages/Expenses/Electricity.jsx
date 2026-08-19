
import { useState } from "react";
import { useExpense } from "../../context/ExpenseContext";

export default function Electricity() {
    const [billNumber, setBillNumber] = useState("");
    const [consumerNumber, setConsumerNumber] = useState("");
    const [units, setUnits] = useState("");
    const [amount, setAmount] = useState("");
    const [paymentDate, setPaymentDate] = useState("");
    const {
        electricityRecords,
        setElectricityRecords,
    } = useExpense();

    const records = electricityRecords;
    const setRecords = setElectricityRecords;

    const handleSubmit = (e) => {
        e.preventDefault();

        if (
            !billNumber ||
            !consumerNumber ||
            !units ||
            !amount
        ) {
            alert("Please fill all required fields");
            return;
        }

        const newRecord = {
            id: Date.now(),
            billNumber,
            consumerNumber,
            units,
            amount: Number(amount),
            paymentDate,
            status: "Paid",
        };

        setRecords([newRecord, ...records]);

        setBillNumber("");
        setConsumerNumber("");
        setUnits("");
        setAmount("");
        setPaymentDate("");
    };

    const totalAmount = records.reduce(
        (sum, item) => sum + item.amount,
        0
    );

    return (
        <div className="min-h-screen bg-slate-950 p-6 text-white">
            <div className="mx-auto max-w-7xl">

                <div className="mb-8">
                    <h1 className="text-3xl font-bold">
                        ⚡ Electricity Management
                    </h1>

                    <p className="mt-2 text-slate-400">
                        Manage electricity bills and payments
                    </p>
                </div>

                <div className="mb-6 grid gap-5 md:grid-cols-3">

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                        <p className="text-slate-400">
                            Total Electricity Expense
                        </p>

                        <h2 className="mt-2 text-3xl font-bold text-yellow-400">
                            ₹{totalAmount.toLocaleString()}
                        </h2>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                        <p className="text-slate-400">
                            Total Bills
                        </p>

                        <h2 className="mt-2 text-3xl font-bold text-cyan-400">
                            {records.length}
                        </h2>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                        <p className="text-slate-400">
                            Payment Status
                        </p>

                        <h2 className="mt-2 text-3xl font-bold text-emerald-400">
                            {records.length ? "Paid" : "Pending"}
                        </h2>
                    </div>

                </div>

                <div className="grid gap-6 lg:grid-cols-3">

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

                        <h2 className="mb-5 text-xl font-semibold">
                            Add Electricity Bill
                        </h2>

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-4"
                        >
                            <input
                                type="text"
                                placeholder="Bill Number"
                                value={billNumber}
                                onChange={(e) =>
                                    setBillNumber(e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3"
                            />

                            <input
                                type="text"
                                placeholder="Consumer Number"
                                value={consumerNumber}
                                onChange={(e) =>
                                    setConsumerNumber(e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3"
                            />

                            <input
                                type="number"
                                placeholder="Units Consumed"
                                value={units}
                                onChange={(e) =>
                                    setUnits(e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3"
                            />

                            <input
                                type="number"
                                placeholder="Bill Amount"
                                value={amount}
                                onChange={(e) =>
                                    setAmount(e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3"
                            />

                            <input
                                type="date"
                                value={paymentDate}
                                onChange={(e) =>
                                    setPaymentDate(e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3"
                            />

                            <button
                                type="submit"
                                className="w-full rounded-xl bg-yellow-500 p-3 font-semibold hover:bg-yellow-600"
                            >
                                Save Bill
                            </button>
                        </form>
                    </div>

                    <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

                        <div className="border-b border-slate-800 p-5">
                            <h2 className="text-xl font-semibold">
                                Electricity Bill History
                            </h2>
                        </div>

                        <table className="w-full">
                            <thead className="bg-slate-800">
                                <tr>
                                    <th className="p-4 text-left">
                                        Bill No
                                    </th>
                                    <th className="p-4 text-left">
                                        Consumer No
                                    </th>
                                    <th className="p-4 text-left">
                                        Units
                                    </th>
                                    <th className="p-4 text-left">
                                        Date
                                    </th>
                                    <th className="p-4 text-left">
                                        Status
                                    </th>
                                    <th className="p-4 text-right">
                                        Amount
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {records.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-t border-slate-800"
                                    >
                                        <td className="p-4">
                                            {item.billNumber}
                                        </td>

                                        <td className="p-4">
                                            {item.consumerNumber}
                                        </td>

                                        <td className="p-4">
                                            {item.units}
                                        </td>

                                        <td className="p-4">
                                            {item.paymentDate}
                                        </td>

                                        <td className="p-4">
                                            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
                                                {item.status}
                                            </span>
                                        </td>

                                        <td className="p-4 text-right font-semibold text-yellow-400">
                                            ₹{item.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}

                                {records.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="p-8 text-center text-slate-500"
                                        >
                                            No electricity bills found
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

