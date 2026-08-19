
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useExpense } from "../../context/ExpenseContext";

export default function ExpenseReport() {
  const {
    rentHistory = [],
    electricityRecords = [],
    staffSalaryRecords = [],
    miscExpenses = [],
  } = useExpense();

  const reportData = useMemo(() => {
    const rentTotal = rentHistory.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const electricityTotal = electricityRecords.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const salaryTotal = staffSalaryRecords.reduce(
      (sum, item) => sum + Number(item.amount || item.salary || 0),
      0
    );

    const miscTotal = miscExpenses.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    return {
      rentTotal,
      electricityTotal,
      salaryTotal,
      miscTotal,
      grandTotal:
        rentTotal +
        electricityTotal +
        salaryTotal +
        miscTotal,
    };
  }, [
    rentHistory,
    electricityRecords,
    staffSalaryRecords,
    miscExpenses,
  ]);

  const categories = [
    {
      name: "Rent",
      amount: reportData.rentTotal,
      color: "text-blue-400",
    },
    {
      name: "Electricity",
      amount: reportData.electricityTotal,
      color: "text-yellow-400",
    },
    {
      name: "Staff Salary",
      amount: reportData.salaryTotal,
      color: "text-emerald-400",
    },
    {
      name: "Miscellaneous",
      amount: reportData.miscTotal,
      color: "text-purple-400",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl p-6">

        <div className="mb-8">
          <Link
            to="/reports"
            className="text-sm text-emerald-400 hover:text-emerald-300"
          >
            ← Back to Reports
          </Link>

          <h1 className="mt-3 text-3xl font-bold">
            Expense Report
          </h1>

          <p className="mt-2 text-slate-400">
            Overview of all business expenses.
          </p>
        </div>

        {/* Summary */}
        <div className="mb-8 rounded-3xl border border-rose-500/20 bg-gradient-to-r from-rose-500/10 to-red-500/5 p-6">
          <p className="text-sm uppercase tracking-wide text-slate-400">
            Total Expenses
          </p>

          <h2 className="mt-3 text-4xl font-bold text-rose-400">
            ₹{reportData.grandTotal.toLocaleString("en-IN")}
          </h2>
        </div>

        {/* Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {categories.map((item) => (
            <div
              key={item.name}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-6"
            >
              <p className="text-sm text-slate-400">
                {item.name}
              </p>

              <h3
                className={`mt-3 text-3xl font-bold ${item.color}`}
              >
                ₹{item.amount.toLocaleString("en-IN")}
              </h3>
            </div>
          ))}
        </div>

        {/* Detailed Report */}
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-6">
            <h2 className="text-xl font-semibold">
              Expense Breakdown
            </h2>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="px-6 py-4 text-left">
                  Category
                </th>

                <th className="px-6 py-4 text-right">
                  Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {categories.map((item) => (
                <tr
                  key={item.name}
                  className="border-b border-slate-800"
                >
                  <td className="px-6 py-4">
                    {item.name}
                  </td>

                  <td
                    className={`px-6 py-4 text-right font-semibold ${item.color}`}
                  >
                    ₹{item.amount.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}

              <tr>
                <td className="px-6 py-5 text-lg font-bold">
                  Grand Total
                </td>

                <td className="px-6 py-5 text-right text-lg font-bold text-rose-400">
                  ₹{reportData.grandTotal.toLocaleString(
                    "en-IN"
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

