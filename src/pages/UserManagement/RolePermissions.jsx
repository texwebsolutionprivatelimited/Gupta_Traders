import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    ShieldCheck,
    Save,
    RotateCcw,
    Check,
} from "lucide-react";

const MODULES = [
    "Dashboard",
    "POS",
    "Products",
    "Categories",
    "Inventory",
    "Purchase",
    "Sales",
    "Suppliers",
    "Customers",
    "Expenses",
    "Reports",
    "Users",
    "Settings",
    "Hardware",
];

const DEFAULT_PERMISSIONS = {
    "Admin / Owner": MODULES,
    Manager: [
        "Dashboard",
        "POS",
        "Products",
        "Inventory",
        "Purchase",
        "Sales",
        "Suppliers",
        "Customers",
        "Reports",
    ],
    "Cashier / Accountant": [
        "POS Billing",
        "Customers",
        "Sales History",
    ],
};

const ROLE_OPTIONS = [
    "Admin / Owner",
    "Manager",
    "Cashier / Accountant",
];

export default function RolePermissions() {
    const [selectedRole, setSelectedRole] = useState("Admin / Owner");
    const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem("rolePermissions");

            if (stored) {
                const parsed = JSON.parse(stored);

                if (parsed && typeof parsed === "object") {
                    setPermissions((prev) => ({
                        ...prev,
                        ...parsed,
                    }));
                }
            }
        } catch (error) {
            console.error("Failed to load role permissions:", error);
        }
    }, []);

    const currentPermissions = permissions[selectedRole] || [];

    const isChecked = (module) => currentPermissions.includes(module);

    const togglePermission = (module) => {
        setSaved(false);

        setPermissions((prev) => {
            const current = prev[selectedRole] || [];

            const updated = current.includes(module)
                ? current.filter((item) => item !== module)
                : [...current, module];

            return {
                ...prev,
                [selectedRole]: updated,
            };
        });
    };

    const selectAll = () => {
        setSaved(false);

        setPermissions((prev) => ({
            ...prev,
            [selectedRole]: [...MODULES],
        }));
    };

    const clearAll = () => {
        setSaved(false);

        setPermissions((prev) => ({
            ...prev,
            [selectedRole]: [],
        }));
    };

    const resetRole = () => {
        setSaved(false);

        setPermissions((prev) => ({
            ...prev,
            [selectedRole]: [
                ...(DEFAULT_PERMISSIONS[selectedRole] || []),
            ],
        }));
    };

    const handleSave = () => {
        try {
            localStorage.setItem(
                "rolePermissions",
                JSON.stringify(permissions)
            );

            setSaved(true);

            setTimeout(() => {
                setSaved(false);
            }, 2500);
        } catch (error) {
            console.error("Failed to save permissions:", error);
            alert("Unable to save permissions.");
        }
    };

    return (
        <div className="min-h-full bg-slate-50 p-4 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-6xl">

                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Link
                            to="/users"
                            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                        >
                            <ArrowLeft size={16} />
                            Back to User Management
                        </Link>

                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <ShieldCheck size={25} />
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                                    Role & Permissions
                                </h1>

                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                    Manage module access for each user role.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSave}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-500/10 transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                    >
                        {saved ? (
                            <>
                                <Check size={18} />
                                Saved
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Save Permissions
                            </>
                        )}
                    </button>
                </div>

                {/* Role Selector */}
                <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Select Role
                        </h2>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Choose a role to configure its system access.
                        </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                        {ROLE_OPTIONS.map((role) => {
                            const active = selectedRole === role;
                            const count = permissions[role]?.length || 0;

                            return (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => {
                                        setSelectedRole(role);
                                        setSaved(false);
                                    }}
                                    className={`rounded-xl border p-4 text-left transition ${
                                        active
                                            ? "border-emerald-500 bg-emerald-50/60 dark:border-emerald-500/50 dark:bg-emerald-500/10"
                                            : "border-slate-200 bg-white hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p
                                                className={`font-semibold ${
                                                    active
                                                        ? "text-emerald-700 dark:text-emerald-400"
                                                        : "text-slate-800 dark:text-slate-200"
                                                }`}
                                            >
                                                {role}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                {getRoleDescription(role)}
                                            </p>
                                        </div>

                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                                active
                                                    ? "bg-emerald-600 text-white dark:bg-emerald-500"
                                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                            }`}
                                        >
                                            {count}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Permission Panel */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

                    {/* Panel Header */}
                    <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                {selectedRole} Permissions
                            </h2>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {currentPermissions.length} of {MODULES.length} modules enabled.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={selectAll}
                                className="rounded-lg border border-emerald-500/30 px-3 py-2 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                            >
                                Select All
                            </button>

                            <button
                                type="button"
                                onClick={clearAll}
                                className="rounded-lg border border-rose-500/30 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                            >
                                Clear All
                            </button>

                            <button
                                type="button"
                                onClick={resetRole}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                <RotateCcw size={14} />
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Permission Grid */}
                    <div className="p-5">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {MODULES.map((module) => {
                                const checked = isChecked(module);

                                return (
                                    <button
                                        key={module}
                                        type="button"
                                        onClick={() => togglePermission(module)}
                                        className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${
                                            checked
                                                ? "border-emerald-500/50 bg-emerald-50/50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                                                : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                                                    checked
                                                        ? "bg-emerald-600 text-white dark:bg-emerald-500"
                                                        : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                                                }`}
                                            >
                                                {checked ? (
                                                    <Check size={18} />
                                                ) : (
                                                    <span className="h-2 w-2 rounded-full bg-current" />
                                                )}
                                            </span>

                                            <div>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {module}
                                                </p>

                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {checked ? "Access enabled" : "Access disabled"}
                                                </p>
                                            </div>
                                        </div>

                                        <span
                                            className={`h-5 w-9 rounded-full p-0.5 transition ${
                                                checked
                                                    ? "bg-emerald-600 dark:bg-emerald-500"
                                                    : "bg-slate-300 dark:bg-slate-700"
                                            }`}
                                        >
                                            <span
                                                className={`block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                                                    checked ? "translate-x-4" : "translate-x-0"
                                                }`}
                                            />
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col gap-3 border-t border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                Selected Role: {selectedRole}
                            </p>

                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Changes are stored in your browser.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleSave}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                        >
                            {saved ? (
                                <>
                                    <Check size={18} />
                                    Permissions Saved
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Save Permissions
                                </>
                            )}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}

function getRoleDescription(role) {
    if (role === "Admin / Owner") {
        return "Full system access";
    }

    if (role === "Manager") {
        return "Business operations access";
    }

    return "Billing and customer access";
}