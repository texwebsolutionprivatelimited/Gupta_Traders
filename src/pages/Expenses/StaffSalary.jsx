
import { useState } from "react";
import { useExpense } from "../../context/ExpenseContext";

export default function StaffSalary() {
    const [employeeName, setEmployeeName] = useState("");
    const [designation, setDesignation] = useState("");
    const [salary, setSalary] = useState("");
    const [paymentDate, setPaymentDate] = useState("");
    const [paymentMode, setPaymentMode] = useState("Cash");

    const {
        staffSalaryRecords,
        setStaffSalaryRecords,
    } = useExpense();

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!employeeName || !designation || !salary) {
            alert("Please fill all required fields");
            return;
        }

        const newRecord = {
            id: Date.now(),
            employeeName,
            designation,
            amount: Number(salary),
            paymentDate,
            paymentMode,
            status: "Paid",
        };

        setStaffSalaryRecords([
            newRecord,
            ...staffSalaryRecords,
        ]);

        setEmployeeName("");
        setDesignation("");
        setSalary("");
        setPaymentDate("");
    };

    const totalSalary = staffSalaryRecords.reduce(
        (sum, item) => sum + item.salary,
        0
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6">
            <div className="mx-auto max-w-7xl">

                <div className="mb-8">
                    <h1 className="text-3xl font-bold">
                        Staff Salary Management
                    </h1>

                    <p className="mt-2 text-slate-400">
                        Manage employee salary payments
                    </p>
                </div>

                <div className="mb-6 grid gap-5 md:grid-cols-3">

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                        <p className="text-slate-400">
                            Total Salary Paid
                        </p>

                        <h2 className="mt-2 text-3xl font-bold text-emerald-400">
                            ₹{totalSalary.toLocaleString()}
                        </h2>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                        <p className="text-slate-400">
                            Employees Paid
                        </p>

                        <h2 className="mt-2 text-3xl font-bold text-blue-400">
                            {staffSalaryRecords.length}
                        </h2>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                        <p className="text-slate-400">
                            Payment Status
                        </p>

                        <h2
                            className={`mt-2 text-3xl font-bold ${staffSalaryRecords.length > 0
                                ? "text-emerald-400"
                                : "text-rose-400"
                                }`}
                        >
                            {staffSalaryRecords.length > 0
                                ? "Paid"
                                : "Pending"}
                        </h2>
                    </div>

                </div>

                <div className="grid gap-6 lg:grid-cols-3">

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

                        <h2 className="mb-5 text-xl font-semibold">
                            Add Salary Record
                        </h2>

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-4"
                        >
                            <input
                                type="text"
                                placeholder="Employee Name"
                                value={employeeName}
                                onChange={(e) =>
                                    setEmployeeName(e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3"
                            />

                            <input
                                type="text"
                                placeholder="Designation"
                                value={designation}
                                onChange={(e) =>
                                    setDesignation(e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3"
                            />

                            <input
                                type="number"
                                placeholder="Salary Amount"
                                value={salary}
                                onChange={(e) =>
                                    setSalary(e.target.value)
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

                            <select
                                value={paymentMode}
                                onChange={(e) =>
                                    setPaymentMode(e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3"
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
                                Save Salary Record
                            </button>
                        </form>
                    </div>

                    <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

                        <div className="border-b border-slate-800 p-5">
                            <h2 className="text-xl font-semibold">
                                Salary History
                            </h2>
                        </div>

                        <table className="w-full">
                            <thead className="bg-slate-800">
                                <tr>
                                    <th className="p-4 text-left">
                                        Employee
                                    </th>
                                    <th className="p-4 text-left">
                                        Designation
                                    </th>
                                    <th className="p-4 text-left">
                                        Date
                                    </th>
                                    <th className="p-4 text-left">
                                        Mode
                                    </th>
                                    <th className="p-4 text-left">
                                        Status
                                    </th>
                                    <th className="p-4 text-right">
                                        Salary
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {staffSalaryRecords.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-t border-slate-800"
                                    >
                                        <td className="p-4">
                                            {item.employeeName}
                                        </td>

                                        <td className="p-4">
                                            {item.designation}
                                        </td>

                                        <td className="p-4">
                                            {item.paymentDate}
                                        </td>

                                        <td className="p-4">
                                            {item.paymentMode}
                                        </td>

                                        <td className="p-4">
                                            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
                                                {item.status}
                                            </span>
                                        </td>

                                        <td className="p-4 text-right font-semibold text-rose-400">
                                            ₹{Number(item.salary || item.amount || 0).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}

                                {staffSalaryRecords.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="p-8 text-center text-slate-500"
                                        >
                                            No salary records available
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


