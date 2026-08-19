import { useState } from "react";
import {
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  Boxes,
  AlertTriangle,
} from "lucide-react";

import CurrentStock from "./CurrentStock";
import StockIn from "./StockIn";
import StockOut from "./StockOut";
import StockAdjustment from "./StockAdjustment";
import OpeningStock from "./OpeningStock";
import LowStockAlert from "./LowStockAlert";

const tabs = [
  {
    id: "current",
    label: "Current Stock",
    shortLabel: "Current",
    icon: Package,
  },
  {
    id: "in",
    label: "Stock In",
    shortLabel: "Stock In",
    icon: ArrowDownToLine,
  },
  {
    id: "out",
    label: "Stock Out",
    shortLabel: "Stock Out",
    icon: ArrowUpFromLine,
  },
  {
    id: "adjustment",
    label: "Stock Adjustment",
    shortLabel: "Adjustment",
    icon: SlidersHorizontal,
  },
  {
    id: "opening",
    label: "Opening Stock",
    shortLabel: "Opening",
    icon: Boxes,
  },
  {
    id: "low",
    label: "Low Stock Alert",
    shortLabel: "Low Stock",
    icon: AlertTriangle,
  },
];

function InventoryContent({ activeTab }) {
  switch (activeTab) {
    case "in":
      return <StockIn />;

    case "out":
      return <StockOut />;

    case "adjustment":
      return <StockAdjustment />;

    case "opening":
      return <OpeningStock />;

    case "low":
      return <LowStockAlert />;

    case "current":
    default:
      return <CurrentStock />;
  }
}

export default function Inventory() {
  const [activeTab, setActiveTab] = useState("current");

  const activeTabData =
    tabs.find((tab) => tab.id === activeTab) || tabs[0];

  const ActiveIcon = activeTabData.icon;

  return (
    <main className="min-h-screen w-full bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 lg:px-8">
        {/* =====================================================
            PAGE HEADER
        ===================================================== */}
        <header className="mb-5 sm:mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                

                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl text-slate-100">
                    Inventory
                  </h1>

                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 sm:text-sm md:text-base">
                    Manage stock, inventory movements and stock alerts
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* =====================================================
            MOBILE ACTIVE TAB INDICATOR
        ===================================================== */}
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:hidden">
          <ActiveIcon
            size={17}
            className="shrink-0 text-emerald-600 dark:text-emerald-400"
          />

          <span className="truncate text-sm font-semibold">
            {activeTabData.label}
          </span>
        </div>

        {/* =====================================================
            TABS
        ===================================================== */}
        <section
          aria-label="Inventory sections"
          className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:mb-6"
        >
          <div
            className="
              scrollbar-thin
              flex
              gap-1.5
              overflow-x-auto
              p-2
              sm:gap-2
            "
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-selected={isActive}
                  aria-label={tab.label}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group
                    flex
                    min-h-[44px]
                    min-w-max
                    shrink-0
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    px-3
                    py-2.5
                    text-xs
                    font-semibold
                    transition-all
                    duration-200
                    focus:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-emerald-500
                    focus-visible:ring-offset-2
                    dark:focus-visible:ring-offset-slate-900
                    sm:px-4
                    sm:text-sm
                    md:px-5
                    ${
                      isActive
                        ? `
                          bg-emerald-600
                          text-white
                          shadow-md
                          shadow-emerald-600/20
                        `
                        : `
                          text-slate-600
                          hover:bg-slate-100
                          hover:text-slate-900
                          dark:text-slate-400
                          dark:hover:bg-slate-800
                          dark:hover:text-white
                        `
                    }
                  `}
                >
                  <Icon
                    size={17}
                    className="shrink-0 sm:h-[18px] sm:w-[18px]"
                  />

                  {/* Mobile */}
                  <span className="sm:hidden">
                    {tab.shortLabel}
                  </span>

                  {/* Tablet/Desktop */}
                  <span className="hidden sm:inline">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* =====================================================
            CONTENT
        ===================================================== */}
        <section
          key={activeTab}
          className="min-w-0 animate-in fade-in duration-200"
        >
          <InventoryContent activeTab={activeTab} />
        </section>
      </div>
    </main>
  );
}