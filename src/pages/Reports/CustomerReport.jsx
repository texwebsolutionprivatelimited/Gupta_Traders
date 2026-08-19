
import { useMemo } from "react";

export default function CustomerReport() {
  const customers = [
    {
      id: 1,
      name: "Rahul Sharma",
      phone: "9876543210",
      city: "Lucknow",
      totalOrders: 12,
      totalPurchase: 48500,
      pendingAmount: 2500,
    },
    {
      id: 2,
      name: "Amit Verma",
      phone: "9123456780",
      city: "Kanpur",
      totalOrders: 8,
      totalPurchase: 32200,
      pendingAmount: 0,
    },
    {
      id: 3,
      name: "Priya Gupta",
      phone: "9988776655",
      city: "Varanasi",
      totalOrders: 15,
      totalPurchase: 68400,
      pendingAmount: 5200,
    },
    {
      id: 4,
      name: "Neha Singh",
      phone: "9012345678",
      city: "Ayodhya",
      totalOrders: 6,
      totalPurchase: 21400,
      pendingAmount: 0,
    },
  ];

  const stats = useMemo(() => {
    return {
      customers: customers.length,
      sales: customers.reduce(
        (sum, item) => sum + item.totalPurchase,
        0
      ),
      pending: customers.reduce(
        (sum, item) => sum + item.pendingAmount,
        0
      ),
    };
  }, [customers]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Customer Report
          </h1>

          <p className="mt-2 text-slate-400">
            Customer purchase and payment summary.
          </p>
        </div>

        <div className="mb-6 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-slate-400">
              Total Customers
            </p>

            <h2 className="mt-2 text-3xl font-bold text-cyan-400">
              {stats.customers}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-slate-400">
              Total Sales
            </p>

            <h2 className="mt-2 text-3xl font-bold text-emerald-400">
              ₹{stats.sales.toLocaleString("en-IN")}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-slate-400">
              Pending Amount
            </p>

            <h2 className="mt-2 text-3xl font-bold text-rose-400">
              ₹{stats.pending.toLocaleString("en-IN")}
            </h2>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-5">
            <h2 className="text-xl font-semibold">
              Customer Details
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="p-4 text-left">
                    Customer
                  </th>
                  <th className="p-4 text-left">
                    Phone
                  </th>
                  <th className="p-4 text-left">
                    City
                  </th>
                  <th className="p-4 text-right">
                    Orders
                  </th>
                  <th className="p-4 text-right">
                    Purchase
                  </th>
                  <th className="p-4 text-right">
                    Pending
                  </th>
                </tr>
              </thead>

              <tbody>
                {customers.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-slate-800"
                  >
                    <td className="p-4">
                      {item.name}
                    </td>

                    <td className="p-4">
                      {item.phone}
                    </td>

                    <td className="p-4">
                      {item.city}
                    </td>

                    <td className="p-4 text-right">
                      {item.totalOrders}
                    </td>

                    <td className="p-4 text-right text-emerald-400 font-semibold">
                      ₹{item.totalPurchase.toLocaleString("en-IN")}
                    </td>

                    <td className="p-4 text-right text-rose-400 font-semibold">
                      ₹{item.pendingAmount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

