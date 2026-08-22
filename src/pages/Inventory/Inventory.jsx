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
    <div className="p-1 sm:p-6 md:p-8 space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
            Inventory
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage stock, inventory movements and stock alerts
          </p>
        </div>
      </div>

      {/* MOBILE ACTIVE TAB INDICATOR */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 sm:hidden">
        <ActiveIcon
          size={17}
          className="shrink-0 text-emerald-400"
        />
        <span className="truncate text-sm font-semibold text-slate-200">
          {activeTabData.label}
        </span>
      </div>

      {/* TABS CONTAINER */}
      <div className="flex gap-2 overflow-x-auto border-b border-slate-800 pb-2 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium transition-all
                ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-slate-900/50 text-slate-400 hover:bg-slate-800 hover:text-white"
                }
              `}
            >
              <Icon size={18} className="shrink-0" />
              <span className="sm:hidden">{tab.shortLabel}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* CONTENT AREA */}
      <div key={activeTab} className="min-w-0 animate-in fade-in duration-200">
        <InventoryContent activeTab={activeTab} />
      </div>
    </div>
  );
}