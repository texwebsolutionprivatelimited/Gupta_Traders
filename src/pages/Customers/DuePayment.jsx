import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Wallet,
  CheckCircle2,
  Clock3,
  CreditCard,
  Banknote,
  Smartphone,
  Eye,
  IndianRupee,
} from "lucide-react";

const initialCustomers = [
  { id: 1, name: "Ramesh Kumar", mobile: "9876543210", totalPurchase: 45000, dueAmount: 5000 },
  { id: 2, name: "Amit Sharma", mobile: "9123456780", totalPurchase: 32500, dueAmount: 2500 },
  { id: 3, name: "Suresh Verma", mobile: "9988776655", totalPurchase: 58000, dueAmount: 8500 },
  { id: 4, name: "Neha Singh", mobile: "9871234567", totalPurchase: 21000, dueAmount: 0 },
  { id: 5, name: "Vikas Gupta", mobile: "9012345678", totalPurchase: 18000, dueAmount: 3000 },
];

const initialPayments = [
  { id: 1, customerId: 1, customer: "Ramesh Kumar", amount: 1000, mode: "Cash", date: "2026-08-12", note: "Partial payment" },
  { id: 2, customerId: 2, customer: "Amit Sharma", amount: 1500, mode: "UPI", date: "2026-08-10", note: "UPI payment" },
];

export default function DuePayment() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem("customers");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (error) {
      console.error("Failed to load customers:", error);
    }
    return initialCustomers;
  });

  const [payments, setPayments] = useState(() => {
    try {
      const saved = localStorage.getItem("customerPayments");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (error) {
      console.error("Failed to load payments:", error);
    }
    return initialPayments;
  });

  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paymentNote, setPaymentNote] = useState("");

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const searchValue = search.toLowerCase();
      return (
        customer.name.toLowerCase().includes(searchValue) ||
        customer.mobile.includes(search)
      );
    });
  }, [customers, search]);

  const customersWithDue = customers.filter(
    (customer) => Number(customer.dueAmount || 0) > 0
  );

  const totalDue = customers.reduce(
    (sum, customer) => sum + Number(customer.dueAmount || 0),
    0
  );

  const totalCollected = payments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );

  const pendingCustomers = customersWithDue.length;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));
  };

  const openPayment = (customer) => {
    setSelectedCustomer(customer);
    setPaymentAmount("");
    setPaymentMode("Cash");
    setPaymentNote("");
  };

  const closePayment = () => {
    setSelectedCustomer(null);
    setPaymentAmount("");
    setPaymentNote("");
  };

  const handlePayment = (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    const currentDue = Number(selectedCustomer.dueAmount || 0);
    if (amount > currentDue) {
      alert(
        `Payment cannot be greater than the current due of ${formatCurrency(currentDue)}.`
      );
      return;
    }

    const payment = {
      id: Date.now(),
      customerId: selectedCustomer.id,
      customer: selectedCustomer.name,
      amount,
      mode: paymentMode,
      date: new Date().toISOString().split("T")[0],
      note: paymentNote || "Due payment received",
    };

    const updatedCustomers = customers.map((customer) => {
      if (customer.id !== selectedCustomer.id) return customer;
      return {
        ...customer,
        dueAmount: Number(customer.dueAmount || 0) - amount,
      };
    });

    const updatedPayments = [payment, ...payments];

    setCustomers(updatedCustomers);
    setPayments(updatedPayments);

    localStorage.setItem("customers", JSON.stringify(updatedCustomers));
    localStorage.setItem("customerPayments", JSON.stringify(updatedPayments));

    alert("Payment received successfully.");
    closePayment();
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span>Customers</span>
              <span>/</span>
              <span className="text-emerald-600 dark:text-emerald-400">Due Payment</span>
            </div>

            <h1 className="text-2xl font-bold sm:text-3xl dark:text-slate-100">
              Due Payment
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage customer outstanding payments and payment history.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/customers/khata")}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Customer Khata
          </button>
        </div>

        {/* Summary */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <PaymentStat
            title="Total Due"
            value={formatCurrency(totalDue)}
            subtitle="Current outstanding amount"
            icon={<Wallet size={21} />}
            iconClass="bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 dark:text-rose-400"
          />

          <PaymentStat
            title="Pending Customers"
            value={pendingCustomers}
            subtitle="Customers with pending dues"
            icon={<Clock3 size={21} />}
            iconClass="bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400"
          />

          <PaymentStat
            title="Payments Collected"
            value={formatCurrency(totalCollected)}
            subtitle="Recorded payments"
            icon={<CheckCircle2 size={21} />}
            iconClass="bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400"
          />

          <PaymentStat
            title="Payment Records"
            value={payments.length}
            subtitle="Total payment entries"
            icon={<CreditCard size={21} />}
            iconClass="bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400"
          />
        </div>

        {/* Search */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer by name or mobile..."
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Customers Due Table */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-5 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Customer Outstanding
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Customers with pending payment amounts.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50 dark:bg-slate-800/60">
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Mobile</th>
                  <th className="px-5 py-4 text-right">Total Purchase</th>
                  <th className="px-5 py-4 text-right">Due Amount</th>
                  <th className="px-5 py-4 text-center">Status</th>
                  <th className="px-5 py-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredCustomers.map((customer) => {
                  const due = Number(customer.dueAmount || 0);

                  return (
                    <tr
                      key={customer.id}
                      className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 font-bold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                            {customer.name
                              .split(" ")
                              .slice(0, 2)
                              .map((word) => word[0])
                              .join("")
                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {customer.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Customer ID: #{customer.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-700 dark:text-slate-300">
                        {customer.mobile}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(customer.totalPurchase)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <span
                          className={`text-lg font-bold ${due > 0
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-emerald-600 dark:text-emerald-400"
                            }`}
                        >
                          {formatCurrency(due)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${due > 0
                              ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                              : "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                            }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${due > 0
                                ? "bg-amber-500 dark:bg-amber-400"
                                : "bg-emerald-500 dark:bg-emerald-400"
                              }`}
                          />
                          {due > 0 ? "Pending" : "Paid"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-2">
                          {due > 0 && (
                            <button
                              type="button"
                              onClick={() => openPayment(customer)}
                              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                            >
                              Receive Payment
                            </button>
                          )}

                          <button
                            type="button"
                            title="View Khata"
                            onClick={() => navigate("/customers/khata")}
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-emerald-600 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
                          >
                            <Eye size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment History */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-5 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Recent Payment History
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Recently received customer payments.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px]">
              <thead className="bg-slate-50 dark:bg-slate-800/60">
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Payment Mode</th>
                  <th className="px-5 py-4">Note</th>
                  <th className="px-5 py-4 text-right">Amount</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-4 font-semibold text-slate-900 dark:text-slate-100">
                      {payment.customer}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {payment.date}
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                        {payment.mode === "Cash" ? (
                          <Banknote size={14} />
                        ) : payment.mode === "UPI" ? (
                          <Smartphone size={14} />
                        ) : (
                          <CreditCard size={14} />
                        )}
                        {payment.mode}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {payment.note}
                    </td>

                    <td className="px-5 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(payment.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:text-white">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Receive Due Payment
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {selectedCustomer.name}
              </p>

              <div className="mt-4 rounded-xl bg-rose-500/10 p-4 dark:bg-rose-500/20">
                <p className="text-xs font-medium uppercase text-rose-600 dark:text-rose-400">
                  Current Due
                </p>

                <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {formatCurrency(selectedCustomer.dueAmount)}
                </p>
              </div>
            </div>

            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Payment Amount
                </label>

                <div className="relative">
                  <IndianRupee
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  />

                  <input
                    type="number"
                    min="1"
                    max={selectedCustomer.dueAmount}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount"
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Payment Mode
                </label>

                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-500"
                >
                  <option value="Cash" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Cash</option>
                  <option value="UPI" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">UPI</option>
                  <option value="Card" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Card</option>
                  <option value="Bank Transfer" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Note
                </label>

                <textarea
                  rows="3"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Payment note..."
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closePayment}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentStat({ title, value, subtitle, icon, iconClass }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-purple-600">{value}</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-red-300">{subtitle}</p>
        </div>

        <div className={`rounded-xl p-3 ${iconClass}`}>{icon}</div>
      </div>
    </div>
  );
}