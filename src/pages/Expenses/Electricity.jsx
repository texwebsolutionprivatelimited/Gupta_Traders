import { useState } from "react";
import { useExpense } from "../../context/ExpenseContext";

export default function Electricity() {
  const [billNumber, setBillNumber] = useState("");
  const [consumerNumber, setConsumerNumber] = useState("");
  const [units, setUnits] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  
  const { electricityRecords, setElectricityRecords } = useExpense();

  const records = electricityRecords;
  const setRecords = setElectricityRecords;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!billNumber || !consumerNumber || !units || !amount) {
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
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            ⚡ Electricity Management
          </h1>

          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Manage electricity bills and payments
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-5 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Electricity Expense
            </p>

            <h2 className="mt-2 text-3xl font-bold text-amber-600 dark:text-yellow-400">
              ₹{totalAmount.toLocaleString()}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Bills
            </p>

            <h2 className="mt-2 text-3xl font-bold text-cyan-600 dark:text-cyan-400">
              {records.length}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Payment Status
            </p>

            <h2 className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {records.length ? "Paid" : "Pending"}
            </h2>
          </div>

        </div>

        <div className="grid gap-6 lg:grid-cols-3">

          {/* Form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">

            <h2 className="mb-5 text-xl font-semibold text-slate-900 dark:text-slate-100">
              Add Electricity Bill
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">

              <input
                type="text"
                placeholder="Bill Number *"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                className="input-field"
              />

              <input
                type="text"
                placeholder="Consumer Number *"
                value={consumerNumber}
                onChange={(e) => setConsumerNumber(e.target.value)}
                className="input-field"
              />

              <input
                type="number"
                placeholder="Units Consumed *"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                className="input-field"
              />

              <input
                type="number"
                placeholder="Bill Amount *"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field"
              />

              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="input-field"
              />

              <button
                type="submit"
                className="w-full rounded-xl bg-amber-500 p-3 font-semibold text-white shadow-sm transition hover:bg-amber-600 dark:bg-yellow-500 dark:text-slate-950 dark:hover:bg-yellow-400"
              >
                Save Bill
              </button>

            </form>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">

            <div className="border-b border-slate-200 p-5 dark:border-slate-800">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Electricity Bill History
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                  <tr>
                    <th className="p-4">Bill No</th>
                    <th className="p-4">Consumer No</th>
                    <th className="p-4">Units</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Amount</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 text-sm text-slate-800 dark:divide-slate-800 dark:text-slate-200">
                  {records.map((item) => (
                    <tr
                      key={item.id}
                      className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="p-4 font-medium text-slate-900 dark:text-slate-50">
                        {item.billNumber}
                      </td>

                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {item.consumerNumber}
                      </td>

                      <td className="p-4 font-medium">
                        {item.units} <span className="text-xs text-slate-500">kWh</span>
                      </td>

                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {item.paymentDate || "N/A"}
                      </td>

                      <td className="p-4">
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400">
                          {item.status}
                        </span>
                      </td>

                      <td className="p-4 text-right font-semibold text-amber-600 dark:text-yellow-400">
                        ₹{item.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}

                  {records.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        className="p-8 text-center text-slate-500 dark:text-slate-400"
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
          border-color: rgb(245, 158, 11);
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
        }

        .dark .input-field {
          border-color: rgb(30, 41, 59);
          background-color: rgb(15, 23, 42);
          color: rgb(241, 245, 249);
        }

        .dark .input-field:focus {
          border-color: rgb(234, 179, 8);
          box-shadow: 0 0 0 2px rgba(234, 179, 8, 0.25);
        }

        .dark .input-field::placeholder {
          color: rgb(100, 116, 139);
        }
      `}</style>
    </div>
  );
}