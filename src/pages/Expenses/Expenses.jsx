
import { Link } from "react-router-dom";
import { useExpense } from "../../context/ExpenseContext";

export default function Expenses() {
    const {
        rentHistory,
        electricityRecords,
        staffSalaryRecords,
        miscExpenses,
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
        (sum, item) =>
            sum + Number(item.amount || item.salary || 0),
        0
    );
    const miscTotal = miscExpenses.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
    );

    const totalExpense =
        rentTotal +
        electricityTotal +
        salaryTotal +
        miscTotal;

    const expenseTypes = [
        {
            title: "Rent",
            path: "/expenses/rent",
            amount: `₹${rentTotal.toLocaleString("en-IN")}`,
            color:
                "from-blue-500/20 to-blue-600/10 border-blue-500/20",
        },
        {
            title: "Electricity",
            path: "/expenses/electricity",
            amount: `₹${electricityTotal.toLocaleString("en-IN")}`,
            color:
                "from-yellow-500/20 to-amber-600/10 border-yellow-500/20",
        },
        {
            title: "Staff Salary",
            path: "/expenses/staff-salary",
            amount: `₹${salaryTotal.toLocaleString("en-IN")}`,
            color:
                "from-emerald-500/20 to-green-600/10 border-emerald-500/20",
        },
        {
            title: "Miscellaneous",
            path: "/expenses/miscellaneous",
            amount: `₹${miscTotal.toLocaleString("en-IN")}`,
            color:
                "from-purple-500/20 to-violet-600/10 border-purple-500/20",
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
            amount: item.amount,
        })),

        ...miscExpenses.map((item) => ({
            date: item.expenseDate,
            category: "Miscellaneous",
            description: item.category,
            amount: item.amount,
        })),
    ]
        .sort(
            (a, b) =>
                new Date(b.date) - new Date(a.date)
        )
        .slice(0, 10);

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <div className="mx-auto max-w-7xl p-6">

                <div className="mb-8">
                    <h1 className="text-3xl font-bold">
                        Expenses Dashboard
                    </h1>

                    <p className="mt-2 text-slate-400">
                        Track and manage all business expenses
                    </p>
                </div>

                <div className="mb-8 rounded-3xl border border-rose-500/20 bg-gradient-to-r from-rose-500/10 to-red-500/5 p-6">
                    <p className="text-sm uppercase tracking-wide text-slate-400">
                        Total Monthly Expenses
                    </p>

                    <h2 className="mt-3 text-4xl font-bold text-rose-400">
                        ₹{totalExpense.toLocaleString("en-IN")}
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        Combined expenses from Rent,
                        Electricity, Staff Salary and
                        Miscellaneous.
                    </p>
                </div>

                <div className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {expenseTypes.map((item) => (
                        <Link
                            key={item.title}
                            to={item.path}
                            className={`rounded-3xl border bg-gradient-to-br ${item.color}
              p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-400">
                                        {item.title}
                                    </p>

                                    <h3 className="mt-3 text-3xl font-bold">
                                        {item.amount}
                                    </h3>
                                </div>

                                <div className="rounded-2xl bg-slate-900/60 p-4">
                                    <span className="text-2xl">
                                        {item.title === "Rent" && "🏢"}
                                        {item.title === "Electricity" && "⚡"}
                                        {item.title === "Staff Salary" && "👨‍💼"}
                                        {item.title === "Miscellaneous" && "📦"}
                                    </span>
                                </div>
                            </div>

                            <p className="mt-4 text-sm text-slate-400">
                                Click to manage{" "}
                                {item.title.toLowerCase()} expenses
                            </p>
                        </Link>
                    ))}
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-900">
                    <div className="border-b border-slate-800 p-6">
                        <h2 className="text-xl font-semibold">
                            Recent Expenses
                        </h2>

                        <p className="mt-1 text-sm text-slate-400">
                            Latest expense transactions
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-400">
                                    <th className="px-6 py-4 text-left">
                                        Date
                                    </th>

                                    <th className="px-6 py-4 text-left">
                                        Category
                                    </th>

                                    <th className="px-6 py-4 text-left">
                                        Description
                                    </th>

                                    <th className="px-6 py-4 text-right">
                                        Amount
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {recentExpenses.length > 0 ? (
                                    recentExpenses.map(
                                        (expense, index) => (
                                            <tr
                                                key={index}
                                                className="border-b border-slate-800"
                                            >
                                                <td className="px-6 py-4">
                                                    {expense.date}
                                                </td>

                                                <td className="px-6 py-4">
                                                    {expense.category}
                                                </td>

                                                <td className="px-6 py-4">
                                                    {expense.description}
                                                </td>

                                                <td className="px-6 py-4 text-right font-semibold text-rose-400">
                                                    ₹
                                                    {Number(
                                                        expense.amount
                                                    ).toLocaleString(
                                                        "en-IN"
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    )
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="4"
                                            className="py-10 text-center text-slate-500"
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



