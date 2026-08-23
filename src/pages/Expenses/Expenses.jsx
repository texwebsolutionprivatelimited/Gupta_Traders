import { Link } from "react-router-dom";
import { useExpense } from "../../context/ExpenseContext";

export default function Expenses() {
  const {
    rentHistory = [],
    electricityRecords = [],
    staffSalaryRecords = [],
    miscExpenses = [],
  } = useExpense();

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

  const totalExpense =
    rentTotal + electricityTotal + salaryTotal + miscTotal;

  const expenseTypes = [
    {
      title: "Rent",
      path: "/expenses/rent",
      amount: `₹${rentTotal.toLocaleString("en-IN")}`,
      cardBg: "bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-950/20 dark:hover:bg-blue-950/40",
      border: "border-blue-200 dark:border-blue-900/40",
      iconBg: "bg-blue-100 dark:bg-blue-900/50",
      text: "text-blue-600 dark:text-blue-400",
      icon: "🏢",
    },
    {
      title: "Electricity",
      path: "/expenses/electricity",
      amount: `₹${electricityTotal.toLocaleString("en-IN")}`,
      cardBg: "bg-amber-50/50 hover:bg-amber-50 dark:bg-amber-950/20 dark:hover:bg-amber-950/40",
      border: "border-amber-200 dark:border-amber-900/40",
      iconBg: "bg-amber-100 dark:bg-amber-900/50",
      text: "text-amber-600 dark:text-amber-400",
      icon: "⚡",
    },
    {
      title: "Staff Salary",
      path: "/expenses/staff-salary",
      amount: `₹${salaryTotal.toLocaleString("en-IN")}`,
      cardBg: "bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40",
      border: "border-emerald-200 dark:border-emerald-900/40",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
      text: "text-emerald-600 dark:text-emerald-400",
      icon: "👨‍💼",
    },
    {
      title: "Miscellaneous",
      path: "/expenses/miscellaneous",
      amount: `₹${miscTotal.toLocaleString("en-IN")}`,
      cardBg: "bg-purple-50/50 hover:bg-purple-50 dark:bg-purple-950/20 dark:hover:bg-purple-950/40",
      border: "border-purple-200 dark:border-purple-900/40",
      iconBg: "bg-purple-100 dark:bg-purple-900/50",
      text: "text-purple-600 dark:text-purple-400",
      icon: "📦",
    },
  ];

  const recentExpenses = [
    ...rentHistory.map((item) => ({
      date: item.paymentDate,
      category: "Rent",
      description: item.propertyName,
      amount: item.amount,
    })),

    ...electricityRecords.map((item) => ({
      date: item.paymentDate,
      category: "Electricity",
      description: item.billNumber,
      amount: item.amount,
    })),

    ...staffSalaryRecords.map((item) => ({
      date: item.paymentDate,
      category: "Staff Salary",
      description: item.employeeName,
      amount: Number(item.amount || item.salary || 0),
    })),

    ...miscExpenses.map((item) => ({
      date: item.expenseDate,
      category: "Miscellaneous",
      description: item.category,
      amount: item.amount,
    })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  return (
    <div className="min-h-full bg-slate-50 p-4 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>Dashboard</span>
            <span>/</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              Expenses
            </span>
          </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">

            Expenses Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track and manage all business expenses in one place.
          </p>
        </div>

        {/* Total Expense Summary Card */}
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/50 p-6 shadow-sm transition hover:shadow-md dark:border-rose-900/30 dark:bg-rose-950/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Total Expenses
              </p>

              <h2 className="mt-2 text-3xl font-extrabold text-rose-600 dark:text-rose-400 sm:text-4xl">
                ₹{totalExpense.toLocaleString("en-IN")}
              </h2>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Combined business expenditure across all categories
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-3xl shadow-sm dark:bg-rose-900/40">
              💸
            </div>
          </div>
        </div>

        {/* Expense Categories Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {expenseTypes.map((item) => (
            <Link
              key={item.title}
              to={item.path}
              className={`group rounded-2xl border ${item.border} ${item.cardBg} p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-md`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {item.title}
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                    {item.amount}
                  </h3>
                </div>

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.iconBg} text-xl shadow-sm transition group-hover:scale-110`}
                >
                  {item.icon}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-200/60 pt-3 dark:border-slate-800">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Manage {item.title}
                </p>

                <span className={`text-xs font-bold ${item.text} transition-transform group-hover:translate-x-1`}>
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Expenses Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Recent Expenses
              </h2>

              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                Latest expense transactions recorded
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {recentExpenses.length} Records
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {recentExpenses.length > 0 ? (
                  recentExpenses.map((expense, index) => (
                    <tr
                      key={index}
                      className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {expense.date || "-"}
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {expense.category}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                        {expense.description || "-"}
                      </td>

                      <td className="px-6 py-4 text-right text-sm font-semibold text-rose-600 dark:text-rose-400">
                        ₹{Number(expense.amount || 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="py-12 text-center text-sm font-medium text-slate-400 dark:text-slate-500"
                    >
                      No expense records found
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