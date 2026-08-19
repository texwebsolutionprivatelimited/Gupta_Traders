
import { useEffect, useMemo, useState } from "react";

// ============================================================
// FALLBACK DASHBOARD DATA
// Used only when localStorage has no actual data.
// ============================================================

const fallbackDashboardData = {
  todaysSales: 24850,
  todaysPurchase: 18200,
  totalProducts: 342,
  totalCustomers: 1285,
  lowStockItems: 8,
};

const fallbackRecentSales = [
  {
    id: "INV-001",
    customer: "Rajesh Kumar",
    items: "Cement (50 bags)",
    amount: 12500,
    time: "2 min ago",
    status: "completed",
  },
  {
    id: "INV-002",
    customer: "Amit Sharma",
    items: "Steel Rods (20 pcs)",
    amount: 8400,
    time: "15 min ago",
    status: "completed",
  },
  {
    id: "INV-003",
    customer: "Priya Singh",
    items: "Paint (10 L)",
    amount: 3200,
    time: "45 min ago",
    status: "pending",
  },
  {
    id: "INV-004",
    customer: "Sunil Gupta",
    items: "Bricks (500 pcs)",
    amount: 4500,
    time: "1 hr ago",
    status: "completed",
  },
  {
    id: "INV-005",
    customer: "Meena Devi",
    items: "Sand (2 trucks)",
    amount: 7800,
    time: "2 hr ago",
    status: "completed",
  },
  {
    id: "INV-006",
    customer: "Vikram Patel",
    items: "Tiles (100 sqft)",
    amount: 6200,
    time: "3 hr ago",
    status: "pending",
  },
];

const fallbackSalesOverview = [
  { day: "Mon", sales: 18500 },
  { day: "Tue", sales: 22300 },
  { day: "Wed", sales: 19800 },
  { day: "Thu", sales: 27600 },
  { day: "Fri", sales: 24100 },
  { day: "Sat", sales: 31200 },
  { day: "Sun", sales: 14500 },
];

// ============================================================
// HELPERS
// ============================================================

function readLocalStorage(key, fallback = []) {
  try {
    const value = JSON.parse(localStorage.getItem(key));

    return Array.isArray(value) ? value : fallback;
  } catch (error) {
    console.error(`Failed to read ${key}:`, error);
    return fallback;
  }
}

function getAmount(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[₹,\s]/g, "");
    const number = Number(cleaned);

    return Number.isFinite(number) ? number : 0;
  }

  return 0;
}

// ------------------------------------------------------------
// Convert different date formats into Date object.
// Supports:
// 2026-08-15
// 2026-08-15T10:30:00
// 15 Aug 2026
// 15/08/2026
// ------------------------------------------------------------

function parseDate(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const stringValue = String(value).trim();

  // DD/MM/YYYY
  const slashMatch = stringValue.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  );

  if (slashMatch) {
    const [, day, month, year] = slashMatch;

    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    return Number.isNaN(date.getTime()) ? null : date;
  }

  // DD-MM-YYYY
  const dashMatch = stringValue.match(
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/
  );

  if (dashMatch) {
    const [, day, month, year] = dashMatch;

    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(stringValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function isToday(value) {
  const date = parseDate(value);

  if (!date) return false;

  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function formatTime(dateValue) {
  if (!dateValue) return "";

  const date = parseDate(dateValue);

  if (!date) return "";

  const now = new Date();

  const diff = Math.floor(
    (now.getTime() - date.getTime()) / 1000
  );

  if (diff < 0) {
    return date.toLocaleDateString("en-IN");
  }

  if (diff < 60) {
    return `${Math.max(diff, 1)} sec ago`;
  }

  if (diff < 3600) {
    return `${Math.floor(diff / 60)} min ago`;
  }

  if (diff < 86400) {
    return `${Math.floor(diff / 3600)} hr ago`;
  }

  return date.toLocaleDateString("en-IN");
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(getAmount(value));
}

// ============================================================
// ICONS
// ============================================================

function SalesIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

function PurchaseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1-1.5 0Z"
      />
    </svg>
  );
}

function ProfitIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m2.25 18 6.75-6.75 4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941"
      />
    </svg>
  );
}

function ProductsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
      />
    </svg>
  );
}

function CustomersIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
      />
    </svg>
  );
}

// ============================================================
// ANIMATED NUMBER
// ============================================================

function AnimatedNumber({ value, isCurrency = false }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const end = getAmount(value);

    const duration = 800;
    const stepTime = 16;
    const steps = Math.ceil(duration / stepTime);
    const increment = end / steps;

    let current = 0;

    const timer = setInterval(() => {
      current += increment;

      if (current >= end) {
        current = end;
        clearInterval(timer);
      }

      setDisplay(Math.floor(current));
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {isCurrency ? "₹" : ""}
      {display.toLocaleString("en-IN")}
    </span>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  title,
  value,
  icon,
  gradient,
  isCurrency = false,
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-slate-700/80 hover:shadow-xl hover:shadow-slate-900/50">
      <div
        className={`absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-20 ${gradient}`}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-400">
            {title}
          </p>

          <p className="text-3xl font-bold tabular-nums text-slate-50">
            <AnimatedNumber
              value={value}
              isCurrency={isCurrency}
            />
          </p>
        </div>

        <div
          className={`rounded-xl bg-gradient-to-br p-3 text-white shadow-lg ${gradient}`}
        >
          {icon}
        </div>
      </div>

      <div
        className={`absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r transition-all duration-500 group-hover:w-full ${gradient}`}
      />
    </div>
  );
}

// ============================================================
// SALES CHART
// ============================================================

function SalesChart({ data }) {
  const maxSales = Math.max(
    ...data.map((item) => getAmount(item.sales)),
    1
  );

  const chartHeight = 220;

  return (
    <div
      className="flex items-end justify-between gap-2 px-2 sm:gap-3"
      style={{ height: chartHeight }}
    >
      {data.map((item) => {
        const barHeight =
          (getAmount(item.sales) / maxSales) *
          (chartHeight - 50);

        return (
          <div
            key={item.day}
            className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
          >
            <div className="min-h-[18px] text-xs font-semibold text-emerald-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              ₹{getAmount(item.sales).toLocaleString("en-IN")}
            </div>

            <div
              className="relative w-full max-w-[48px] overflow-hidden rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-700 ease-out group-hover:from-emerald-500 group-hover:to-cyan-400"
              style={{
                height: `${Math.max(barHeight, 4)}px`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>

            <span className="text-xs font-medium text-slate-500 transition-colors group-hover:text-slate-300">
              {item.day}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({ status }) {
  const normalized =
    String(status || "completed").toLowerCase();

  const isCompleted =
    normalized === "completed" ||
    normalized === "paid" ||
    normalized === "success";

  if (isCompleted) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        Completed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
      Pending
    </span>
  );
}

// ============================================================
// MAIN DASHBOARD
// ============================================================

export default function Dashboard() {
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  // ==========================================================
  // LOAD ALL DASHBOARD DATA
  // ==========================================================

  useEffect(() => {
    const loadDashboardData = () => {
      setSales(
        readLocalStorage("salesHistory", [])
      );

      setPurchases(
        readLocalStorage("purchaseHistory", [])
      );

      // Supports different product storage keys.
      const savedProducts =
        readLocalStorage("products", []);

      const savedProductList =
        readLocalStorage("productList", []);

      setProducts(
        savedProducts.length
          ? savedProducts
          : savedProductList
      );

      // Supports different customer storage keys.
      const savedCustomers =
        readLocalStorage("customers", []);

      const savedCustomerList =
        readLocalStorage("customerList", []);

      setCustomers(
        savedCustomers.length
          ? savedCustomers
          : savedCustomerList
      );
    };

    loadDashboardData();

    const handleStorage = (event) => {
      const watchedKeys = [
        "salesHistory",
        "purchaseHistory",
        "products",
        "productList",
        "customers",
        "customerList",
      ];

      if (
        !event.key ||
        watchedKeys.includes(event.key)
      ) {
        loadDashboardData();
      }
    };

    window.addEventListener(
      "storage",
      handleStorage
    );

    // Same-tab updates.
    const interval = setInterval(
      loadDashboardData,
      1000
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );

      clearInterval(interval);
    };
  }, []);

  // ==========================================================
  // TODAY'S SALES
  // ==========================================================

  const todaysSales = useMemo(() => {
    if (!sales.length) {
      return fallbackDashboardData.todaysSales;
    }

    const todaySales = sales
      .filter((sale) =>
        isToday(
          sale.createdAt ||
            sale.date ||
            sale.saleDate ||
            sale.created_at
        )
      )
      .reduce(
        (sum, sale) =>
          sum +
          getAmount(
            sale.total ??
              sale.amount ??
              sale.grandTotal ??
              sale.netTotal
          ),
        0
      );

    return todaySales;
  }, [sales]);

  // ==========================================================
  // TODAY'S PURCHASE
  // ==========================================================

  const todaysPurchase = useMemo(() => {
    if (!purchases.length) {
      return fallbackDashboardData.todaysPurchase;
    }

    return purchases
      .filter((purchase) =>
        isToday(
          purchase.createdAt ||
            purchase.date ||
            purchase.purchaseDate ||
            purchase.created_at
        )
      )
      .reduce(
        (sum, purchase) =>
          sum +
          getAmount(
            purchase.total ??
              purchase.amount ??
              purchase.grandTotal ??
              purchase.netTotal
          ),
        0
      );
  }, [purchases]);

  // ==========================================================
  // TODAY'S PROFIT
  // ==========================================================

  const todaysProfit = useMemo(() => {
    return Math.max(
      0,
      todaysSales - todaysPurchase
    );
  }, [todaysSales, todaysPurchase]);

  // ==========================================================
  // TOTAL PRODUCTS
  // ==========================================================

  const totalProducts = useMemo(() => {
    if (!products.length) {
      return fallbackDashboardData.totalProducts;
    }

    return products.length;
  }, [products]);

  // ==========================================================
  // TOTAL CUSTOMERS
  // ==========================================================

  const totalCustomers = useMemo(() => {
    if (!customers.length) {
      return fallbackDashboardData.totalCustomers;
    }

    return customers.length;
  }, [customers]);

  // ==========================================================
  // LOW STOCK
  // ==========================================================

  const lowStockItems = useMemo(() => {
    if (!products.length) {
      return fallbackDashboardData.lowStockItems;
    }

    return products.filter((product) => {
      const stock = getAmount(
        product.stock ??
          product.currentStock ??
          product.quantity
      );

      const minimum = getAmount(
        product.minStock ??
          product.minimumStock ??
          product.lowStockLimit ??
          product.reorderLevel
      );

      return (
        stock <= minimum &&
        minimum > 0
      );
    }).length;
  }, [products]);

  // ==========================================================
  // RECENT SALES
  // ==========================================================

  const recentSales = useMemo(() => {
    if (!sales.length) {
      return fallbackRecentSales;
    }

    return sales
      .slice()
      .sort((a, b) => {
        const dateA = parseDate(
          a.createdAt || a.date
        );

        const dateB = parseDate(
          b.createdAt || b.date
        );

        return (
          (dateB?.getTime() || 0) -
          (dateA?.getTime() || 0)
        );
      })
      .slice(0, 6)
      .map((sale, index) => ({
        id:
          sale.invoice ||
          sale.invoiceNo ||
          sale.id ||
          `INV-${String(index + 1).padStart(3, "0")}`,

        customer:
          sale.customer ||
          sale.customerName ||
          "Walk-in Customer",

        items:
          Array.isArray(sale.items)
            ? sale.items
                .map((item) => {
                  const product =
                    item.product ||
                    item.name ||
                    "Product";

                  const quantity =
                    item.quantity ??
                    item.qty ??
                    0;

                  return `${product} (${quantity})`;
                })
                .join(", ")
            : sale.items || "No items",

        amount: getAmount(
          sale.total ??
            sale.amount ??
            sale.grandTotal
        ),

        time: formatTime(
          sale.createdAt ||
            sale.date ||
            sale.saleDate
        ),

        status:
          sale.status ||
          "completed",
      }));
  }, [sales]);

  // ==========================================================
  // SALES OVERVIEW
  // ==========================================================

  const salesOverview = useMemo(() => {
    if (!sales.length) {
      return fallbackSalesOverview;
    }

    const dayNames = [
      "Sun",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
    ];

    const overview = dayNames.map(
      (day) => ({
        day,
        sales: 0,
      })
    );

    const today = new Date();

    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const dayDiff = (date) => {
      const startOfDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );

      return Math.floor(
        (startOfToday.getTime() -
          startOfDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );
    };

    sales.forEach((sale) => {
      const date = parseDate(
        sale.createdAt ||
          sale.date ||
          sale.saleDate
      );

      if (!date) return;

      const diffDays = dayDiff(date);

      if (
        diffDays >= 0 &&
        diffDays < 7
      ) {
        const dayIndex = date.getDay();

        overview[dayIndex].sales +=
          getAmount(
            sale.total ??
              sale.amount ??
              sale.grandTotal
          );
      }
    });

    // Monday → Sunday
    return [
      overview[1],
      overview[2],
      overview[3],
      overview[4],
      overview[5],
      overview[6],
      overview[0],
    ];
  }, [sales]);

  // ==========================================================
  // WEEKLY TOTAL
  // ==========================================================

  const totalWeeklySales = useMemo(() => {
    return salesOverview.reduce(
      (sum, item) =>
        sum + getAmount(item.sales),
      0
    );
  }, [salesOverview]);

  // ==========================================================
  // AVERAGE DAILY SALES
  // ==========================================================

  const averageDailySales = useMemo(() => {
    return Math.round(
      totalWeeklySales / 7
    );
  }, [totalWeeklySales]);

  // ==========================================================
  // BEST SALES DAY
  // ==========================================================

  const bestDay = useMemo(() => {
    return salesOverview.reduce(
      (best, current) =>
        getAmount(current.sales) >
        getAmount(best.sales)
          ? current
          : best,
      salesOverview[0] || {
        day: "N/A",
        sales: 0,
      }
    );
  }, [salesOverview]);

  // ==========================================================
  // GREETING
  // ==========================================================

  const now = new Date();

  const greeting =
    now.getHours() < 12
      ? "Good Morning"
      : now.getHours() < 17
        ? "Good Afternoon"
        : "Good Evening";

  const formattedDate =
    now.toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

  // ==========================================================
  // DASHBOARD STATS
  // ==========================================================

  const stats = [
    {
      title: "Today's Sales",
      value: todaysSales,
      icon: <SalesIcon />,
      gradient:
        "from-emerald-500 to-teal-600",
      isCurrency: true,
    },
    {
      title: "Today's Purchase",
      value: todaysPurchase,
      icon: <PurchaseIcon />,
      gradient:
        "from-blue-500 to-indigo-600",
      isCurrency: true,
    },
    {
      title: "Today's Profit",
      value: todaysProfit,
      icon: <ProfitIcon />,
      gradient:
        "from-violet-500 to-purple-600",
      isCurrency: true,
    },
    {
      title: "Total Products",
      value: totalProducts,
      icon: <ProductsIcon />,
      gradient:
        "from-cyan-500 to-sky-600",
      isCurrency: false,
    },
    {
      title: "Total Customers",
      value: totalCustomers,
      icon: <CustomersIcon />,
      gradient:
        "from-orange-500 to-amber-600",
      isCurrency: false,
    },
    {
      title: "Low Stock Alert",
      value: lowStockItems,
      icon: <AlertIcon />,
      gradient:
        "from-rose-500 to-red-600",
      isCurrency: false,
    },
  ];

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="min-h-screen selection:bg-emerald-500 selection:text-white">

      {/* Background Effects */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-[120px]" />

        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Greeting */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-50 sm:text-3xl">
            {greeting} 👋
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            {formattedDate} — Here's your
            business overview
          </p>
        </div>

        {/* =====================================================
            STATS
        ====================================================== */}

        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              gradient={stat.gradient}
              isCurrency={stat.isCurrency}
            />
          ))}
        </div>

        {/* =====================================================
            RECENT SALES + SALES OVERVIEW
        ====================================================== */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

          {/* Recent Sales */}
          <div className="overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl lg:col-span-3">

            <div className="flex items-center justify-between border-b border-slate-800/60 p-5">

              <div className="flex items-center gap-3">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2">
                  <SalesIcon />
                </div>

                <h3 className="text-lg font-semibold text-slate-100">
                  Recent Sales
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    "/sales/history";
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/10 hover:text-emerald-300"
              >
                View All →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">

                <thead>
                  <tr className="border-b border-slate-800/60">

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Invoice
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Customer
                    </th>

                    <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 md:table-cell">
                      Items
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Amount
                    </th>

                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/40">

                  {recentSales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="transition-colors hover:bg-slate-800/30"
                    >

                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-medium text-slate-300">
                          {sale.id}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div>
                          <p className="font-medium text-slate-200">
                            {sale.customer}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {sale.time}
                          </p>
                        </div>
                      </td>

                      <td className="hidden px-5 py-3.5 text-slate-400 md:table-cell">
                        {sale.items}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <span className="font-semibold text-slate-100">
                          {formatCurrency(
                            sale.amount
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <StatusBadge
                          status={sale.status}
                        />
                      </td>

                    </tr>
                  ))}

                </tbody>
              </table>
            </div>
          </div>

          {/* =================================================
              SALES OVERVIEW
          ================================================== */}

          <div className="overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl lg:col-span-2">

            <div className="flex items-center justify-between border-b border-slate-800/60 p-5">

              <div className="flex items-center gap-3">

                <div className="rounded-lg border border-violet-500/20 bg-violet-500/10 p-2">

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-violet-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                    />
                  </svg>

                </div>

                <h3 className="text-lg font-semibold text-slate-100">
                  Sales Overview
                </h3>

              </div>

              <span className="rounded-full border border-slate-700/40 bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-slate-500">
                This Week
              </span>

            </div>

            {/* Weekly Summary */}
            <div className="grid grid-cols-2 gap-4 border-b border-slate-800/40 p-5">

              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">
                  Total Revenue
                </p>

                <p className="text-xl font-bold text-slate-50">
                  {formatCurrency(
                    totalWeeklySales
                  )}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">
                  Avg. Daily
                </p>

                <p className="text-xl font-bold text-slate-50">
                  {formatCurrency(
                    averageDailySales
                  )}
                </p>
              </div>

            </div>

            {/* Chart */}
            <div className="p-5">
              <SalesChart
                data={salesOverview}
              />
            </div>

            {/* Best Day */}
            <div className="mx-5 mb-5 flex items-center gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3">

              <div className="rounded-lg bg-emerald-500/15 p-1.5">

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
                  />
                </svg>

              </div>

              <div>
                <p className="text-xs font-semibold text-emerald-400">
                  Best Day: {bestDay.day}
                </p>

                <p className="text-xs text-slate-500">
                  {formatCurrency(
                    bestDay.sales
                  )}{" "}
                  in sales
                </p>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

