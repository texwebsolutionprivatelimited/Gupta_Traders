
import { useMemo } from "react";

export default function SupplierReport() {
  const suppliers = [
    {
      id: 1,
      name: "ABC Cement Suppliers",
      phone: "9876500011",
      category: "Cement",
      totalPurchase: 95000,
      dueAmount: 12000,
    },
    {
      id: 2,
      name: "Shree Traders",
      phone: "9876500022",
      category: "Steel",
      totalPurchase: 125000,
      dueAmount: 5000,
    },
    {
      id: 3,
      name: "Raj Hardware",
      phone: "9876500033",
      category: "Hardware",
      totalPurchase: 72000,
      dueAmount: 0,
    },
    {
      id: 4,
      name: "Gupta Building Materials",
      phone: "9876500044",
      category: "Tiles",
      totalPurchase: 88000,
      dueAmount: 8000,
    },
  ];

  const stats = useMemo(() => {
    return {
      suppliers: suppliers.length,
      purchase: suppliers.reduce(
        (sum, item) => sum + item.totalPurchase,
        0
      ),
      due: suppliers.reduce(
        (sum, item) => sum + item.dueAmount,
        0
      ),
    };
  }, [suppliers]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Supplier Report
          </h1>

          <p className="mt-2 text-slate-400">
            Supplier purchase and payment report.
          </p>
        </div>

        <div className="mb-6 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-slate-400">
              Total Suppliers
            </p>

            <h2 className="mt-2 text-3xl font-bold text-cyan-400">
              {stats.suppliers}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-slate-400">
              Total Purchase
            </p>

            <h2 className="mt-2 text-3xl font-bold text-amber-400">
              ₹{stats.purchase.toLocaleString("en-IN")}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-slate-400">
              Total Due
            </p>

            <h2 className="mt-2 text-3xl font-bold text-rose-400">
              ₹{stats.due.toLocaleString("en-IN")}
            </h2>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-5">
            <h2 className="text-xl font-semibold">
              Supplier Details
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="p-4 text-left">
                    Supplier
                  </th>
                  <th className="p-4 text-left">
                    Phone
                  </th>
                  <th className="p-4 text-left">
                    Category
                  </th>
                  <th className="p-4 text-right">
                    Purchase
                  </th>
                  <th className="p-4 text-right">
                    Due Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {suppliers.map((item) => (
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
                      {item.category}
                    </td>

                    <td className="p-4 text-right text-amber-400 font-semibold">
                      ₹{item.totalPurchase.toLocaleString("en-IN")}
                    </td>

                    <td className="p-4 text-right text-rose-400 font-semibold">
                      ₹{item.dueAmount.toLocaleString("en-IN")}
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

