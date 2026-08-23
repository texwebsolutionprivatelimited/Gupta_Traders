import { useState } from "react";
import { useExpense } from "../../context/ExpenseContext";

export default function StaffSalary() {
  const [employeeName, setEmployeeName] = useState("");
  const [designation, setDesignation] = useState("");
  const [salary, setSalary] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");

  const { staffSalaryRecords, setStaffSalaryRecords } = useExpense();

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

    setStaffSalaryRecords([newRecord, ...staffSalaryRecords]);

    setEmployeeName("");
    setDesignation("");
    setSalary("");
    setPaymentDate("");
  };

  const totalSalary = staffSalaryRecords.reduce(
    (sum, item) => sum + Number(item.amount || item.salary || 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            💼 Staff Salary Management
          </h1>

          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Manage employee salary payments
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-5 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Salary Paid
            </p>

            <h2 className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ₹{totalSalary.toLocaleString()}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Employees Paid
            </p>

            <h2 className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
              {staffSalaryRecords.length}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Payment Status
            </p>

            <h2
              className={`mt-2 text-2xl font-bold ${
                staffSalaryRecords.length > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {staffSalaryRecords.length > 0 ? "Paid" : "Pending"}
            </h2>
          </div>

        </div>

        <div className="grid gap-6 lg:grid-cols-3">

          {/* Form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">

            <h2 className="mb-5 text-xl font-semibold text-slate-900 dark:text-slate-50">
              Add Salary Record
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">

              <input
                type="text"
                placeholder="Employee Name *"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className="input-field"
              />

              <input
                type="text"
                placeholder="Designation *"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="input-field"
              />

              <input
                type="number"
                placeholder="Salary Amount *"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="input-field"
              />

              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="input-field"
              />

              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="input-field"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 p-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950"
              >
                Save Salary Record
              </button>

            </form>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">

            <div className="border-b border-slate-200 p-5 dark:border-slate-800">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                Salary History
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                  <tr>
                    <th className="p-4">Employee</th>
                    <th className="p-4">Designation</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Mode</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Salary</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 text-sm text-slate-800 dark:divide-slate-800 dark:text-slate-200">
                  {staffSalaryRecords.map((item) => (
                    <tr
                      key={item.id}
                      className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="p-4 font-medium">
                        {item.employeeName}
                      </td>

                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {item.designation}
                      </td>

                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {item.paymentDate || "N/A"}
                      </td>

                      <td className="p-4">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {item.paymentMode}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400">
                          {item.status}
                        </span>
                      </td>

                      <td className="p-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        ₹{Number(item.salary || item.amount || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}

                  {staffSalaryRecords.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        className="p-8 text-center text-slate-500 dark:text-slate-400"
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

      <style>{`
        .input-field {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(226, 232, 240);
          background-color: rgb(255, 255, 255);
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: rgb(15, 23, 42);
          outline: none;
          transition: all 0.2s;
        }

        .input-field:focus {
          border-color: rgb(16, 185, 129);
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }

        .dark .input-field {
          border-color: rgb(30, 41, 59);
          background-color: rgb(15, 23, 42);
          color: rgb(241, 245, 249);
        }

        .dark .input-field:focus {
          border-color: rgb(52, 211, 153);
          box-shadow: 0 0 0 2px rgba(52, 211, 153, 0.25);
        }

        .dark .input-field::placeholder {
          color: rgb(100, 116, 139);
        }
      `}</style>
    </div>
  );
}