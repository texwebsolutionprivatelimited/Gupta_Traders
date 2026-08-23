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

  const { miscExpenses, setMiscExpenses } = useExpense();

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
      expenseDate: new Date().toISOString().split("T")[0],
      description: "",
      paymentMode: "Cash",
    });
  };

  const totalExpense = expenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const officeSuppliesTotal = expenses
    .filter((item) => item.category === "Office Supplies")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const maintenanceTotal = expenses
    .filter((item) => item.category === "Repair & Maintenance")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const otherExpensesTotal = expenses
    .filter(
      (item) =>
        item.category !== "Office Supplies" &&
        item.category !== "Repair & Maintenance"
    )
    .reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl">

        {/* Header Section */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/expenses"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              ← Back to Expenses
            </Link>

            <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">
              Miscellaneous Expenses
            </h1>

            <p className="mt-1 text-slate-600 dark:text-slate-400">
              Manage office and miscellaneous business expenses
            </p>
          </div>

          <div className="rounded-2xl border border-purple-200 bg-purple-50 px-5 py-4 dark:border-purple-500/20 dark:bg-purple-500/10">
            <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Total Expense
            </p>

            <h2 className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">
              ₹{totalExpense.toLocaleString("en-IN")}
            </h2>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">

          {/* Form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-5 text-xl font-semibold text-slate-900 dark:text-slate-50">
              Add Expense
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">

              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input-field"
              >
                <option>Office Supplies</option>
                <option>Stationery</option>
                <option>Cleaning Materials</option>
                <option>Internet Charges</option>
                <option>Transportation</option>
                <option>Tea & Snacks</option>
                <option>Repair & Maintenance</option>
                <option>Other</option>
              </select>

              <input
                type="number"
                name="amount"
                placeholder="Expense Amount *"
                value={formData.amount}
                onChange={handleChange}
                className="input-field"
              />

              <input
                type="text"
                name="vendor"
                placeholder="Vendor / Supplier"
                value={formData.vendor}
                onChange={handleChange}
                className="input-field"
              />

              <input
                type="date"
                name="expenseDate"
                value={formData.expenseDate}
                onChange={handleChange}
                className="input-field"
              />

              <select
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleChange}
                className="input-field"
              >
                <option>Cash</option>
                <option>UPI</option>
                <option>Bank Transfer</option>
                <option>Cheque</option>
              </select>

              <textarea
                rows="4"
                name="description"
                placeholder="Expense Description"
                value={formData.description}
                onChange={handleChange}
                className="input-field"
              />

              <button
                type="submit"
                className="w-full rounded-xl bg-purple-600 py-3 font-semibold text-white shadow-sm transition hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
              >
                Save Expense
              </button>

            </form>
          </div>

          <div className="lg:col-span-2">

            {/* Stats Overview */}
            <div className="mb-6 grid gap-4 md:grid-cols-3">

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Office Supplies
                </p>

                <h3 className="mt-2 text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                  ₹{officeSuppliesTotal.toLocaleString("en-IN")}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Maintenance
                </p>

                <h3 className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
                  ₹{maintenanceTotal.toLocaleString("en-IN")}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Other Expenses
                </p>

                <h3 className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
                  ₹{otherExpensesTotal.toLocaleString("en-IN")}
                </h3>
              </div>

            </div>

            {/* History Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

              <div className="border-b border-slate-200 p-5 dark:border-slate-800">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                  Expense History
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                    <tr>
                      <th className="p-4">Date</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Vendor</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4 text-right">Amount</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 text-sm text-slate-800 dark:divide-slate-800 dark:text-slate-200">
                    {expenses.map((expense) => (
                      <tr
                        key={expense.id}
                        className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      >
                        <td className="p-4 text-slate-600 dark:text-slate-400">
                          {expense.expenseDate}
                        </td>

                        <td className="p-4 font-medium text-slate-900 dark:text-slate-50">
                          {expense.category}
                        </td>

                        <td className="p-4 text-slate-600 dark:text-slate-400">
                          {expense.vendor || "-"}
                        </td>

                        <td className="p-4">
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {expense.paymentMode}
                          </span>
                        </td>

                        <td className="p-4 text-right font-semibold text-rose-600 dark:text-rose-400">
                          ₹{Number(expense.amount).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}

                    {expenses.length === 0 && (
                      <tr>
                        <td
                          colSpan="5"
                          className="p-8 text-center text-slate-500 dark:text-slate-400"
                        >
                          No expenses recorded yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

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
          border-color: rgb(168, 85, 247);
          box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.2);
        }

        .dark .input-field {
          border-color: rgb(30, 41, 59);
          background-color: rgb(15, 23, 42);
          color: rgb(241, 245, 249);
        }

        .dark .input-field:focus {
          border-color: rgb(192, 132, 252);
          box-shadow: 0 0 0 2px rgba(192, 132, 252, 0.25);
        }

        .dark .input-field::placeholder {
          color: rgb(100, 116, 139);
        }
      `}</style>
    </div>
  );
}