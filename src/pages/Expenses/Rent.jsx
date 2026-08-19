
import { useState } from "react";
import { useExpense } from "../../context/ExpenseContext";

export default function Rent() {
    const [rentAmount, setRentAmount] = useState("");
    const [ownerName, setOwnerName] = useState("");
    const [propertyName, setPropertyName] = useState("");
    const [paymentDate, setPaymentDate] = useState("");
    const [paymentMode, setPaymentMode] = useState("Cash");

    const {
        rentHistory,
        setRentHistory,
    } = useExpense();

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!rentAmount || !ownerName || !propertyName) {
            alert("Please fill all required fields");
            return;
        }

        const newRent = {
            id: Date.now(),
            propertyName,
            ownerName,
            amount: Number(rentAmount),
            paymentDate,
            paymentMode,
        };

        setRentHistory([newRent, ...rentHistory]);

        setRentAmount("");
        setOwnerName("");
        setPropertyName("");
        setPaymentDate("");
    };

    const totalRent = rentHistory.reduce(
        (sum, item) => sum + item.amount,
        0
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6">
            <div className="mx-auto max-w-7xl">

                <div className="mb-8">
                    <h1 className="text-3xl font-bold">
                        Shop Rent Management
                    </h1>

                    <p className="text-slate-400 mt-2">
                        Manage monthly shop rent records
                    </p>
                </div>

                {/* Stats */}
                <div className="mb-6 grid gap-5 md:grid-cols-2">

                    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
                        <p className="text-slate-400">
                            Total Rent Paid
                        </p>

                        <h2 className="mt-2 text-3xl font-bold text-emerald-400">
                            ₹{totalRent.toLocaleString()}
                        </h2>
                    </div>

                    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
                        <p className="text-slate-400">
                            Total Records
                        </p>

                        <h2 className="mt-2 text-3xl font-bold text-blue-400">
                            {rentHistory.length}
                        </h2>
                    </div>

                </div>

                <div className="grid gap-6 lg:grid-cols-3">

                    {/* Form */}
                    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">

                        <h2 className="mb-5 text-xl font-semibold">
                            Add Rent Record
                        </h2>

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-4"
                        >
                            <input
                                type="text"
                                placeholder="Shop / Property Name"
                                value={propertyName}
                                onChange={(e) =>
                                    setPropertyName(e.target.value)
                                }
                                className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3"
                            />

                            <input
                                type="text"
                                placeholder="Owner Name"
                                value={ownerName}
                                onChange={(e) =>
                                    setOwnerName(e.target.value)
                                }
                                className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3"
                            />

                            <input
                                type="number"
                                placeholder="Rent Amount"
                                value={rentAmount}
                                onChange={(e) =>
                                    setRentAmount(e.target.value)
                                }
                                className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3"
                            />

                            <input
                                type="date"
                                value={paymentDate}
                                onChange={(e) =>
                                    setPaymentDate(e.target.value)
                                }
                                className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3"
                            />

                            <select
                                value={paymentMode}
                                onChange={(e) =>
                                    setPaymentMode(e.target.value)
                                }
                                className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3"
                            >
                                <option>Cash</option>
                                <option>UPI</option>
                                <option>Bank Transfer</option>
                                <option>Cheque</option>
                            </select>

                            <button
                                type="submit"
                                className="w-full rounded-xl bg-emerald-500 p-3 font-semibold hover:bg-emerald-600"
                            >
                                Save Rent Record
                            </button>
                        </form>
                    </div>

                    {/* Table */}
                    <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">

                        <div className="p-5 border-b border-slate-800">
                            <h2 className="text-xl font-semibold">
                                Rent History
                            </h2>
                        </div>

                        <table className="w-full">
                            <thead className="bg-slate-800">
                                <tr>
                                    <th className="p-4 text-left">
                                        Property
                                    </th>
                                    <th className="p-4 text-left">
                                        Owner
                                    </th>
                                    <th className="p-4 text-left">
                                        Date
                                    </th>
                                    <th className="p-4 text-left">
                                        Mode
                                    </th>
                                    <th className="p-4 text-right">
                                        Amount
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {rentHistory.map((rent) => (
                                    <tr
                                        key={rent.id}
                                        className="border-t border-slate-800"
                                    >
                                        <td className="p-4">
                                            {rent.propertyName}
                                        </td>

                                        <td className="p-4">
                                            {rent.ownerName}
                                        </td>

                                        <td className="p-4">
                                            {rent.paymentDate}
                                        </td>

                                        <td className="p-4">
                                            {rent.paymentMode}
                                        </td>

                                        <td className="p-4 text-right text-rose-400 font-semibold">
                                            ₹{rent.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}

                                {rentHistory.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="p-8 text-center text-slate-500"
                                        >
                                            No rent records available
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

