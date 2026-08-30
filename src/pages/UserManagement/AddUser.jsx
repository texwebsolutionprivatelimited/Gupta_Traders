import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminUsers } from '../../services/erpService'
import {
    ArrowLeft,
    Save,
    ShieldCheck,
    AlertCircle,
    UserRound,
    Lock,
} from "lucide-react";

const roles = [
    "Admin / Owner",
    "Manager",
    "Cashier / Accountant",
];

export default function AddUser() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        mobile: "",
        role: "Cashier / Accountant",
        status: "Active",
        password: "",
        confirmPassword: "",
    });

    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const {
            name,
            email,
            mobile,
            role,
            status,
            password,
            confirmPassword,
        } = formData;

        // Basic Validations
        if (!name.trim()) {
            setError("Please enter user name.");
            return;
        }

        if (!email.trim()) {
            setError("Please enter email address.");
            return;
        }

        if (!mobile.trim() || mobile.length !== 10) {
            setError("Please enter a valid 10-digit mobile number.");
            return;
        }

        if (!password || password.length < 6) {
            setError("New user password must be at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try{await adminUsers('create',{name:name.trim(),email:email.trim(),mobile:mobile.trim(),role:role==='Admin / Owner'?'admin':role==='Manager'?'manager':'cashier',status:status==='Active'?'active':'inactive',password});alert('User added successfully!');navigate('/users')}catch(error){setError(error.message)}
    };

    const inputClassName =
        "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20";

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-4xl">

                {/* Back Link */}
                <Link
                    to="/users"
                    className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
                >
                    <ArrowLeft size={16} />
                    <span>Back to Users</span>
                </Link>

                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                            Add New User
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Create a new system user and assign role-based permissions.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Error Banner */}
                    {error && (
                        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-500/10 dark:text-rose-400">
                            <AlertCircle size={18} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Section 1: Basic Information */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
                        <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                <UserRound size={20} />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                    Basic Information
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Enter user's personal details and contact information
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <FormField label="Full Name" required>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. John Doe"
                                    className={inputClassName}
                                />
                            </FormField>

                            <FormField label="Email Address" required>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="user@example.com"
                                    className={inputClassName}
                                />
                            </FormField>

                            <FormField label="Mobile Number" required>
                                <input
                                    type="tel"
                                    name="mobile"
                                    value={formData.mobile}
                                    onChange={(e) => {
                                        const value = e.target.value
                                            .replace(/\D/g, "")
                                            .slice(0, 10);

                                        setFormData((prev) => ({
                                            ...prev,
                                            mobile: value,
                                        }));

                                        setError("");
                                    }}
                                    placeholder="10-digit mobile number"
                                    className={inputClassName}
                                />
                            </FormField>

                            <FormField label="Status">
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className={inputClassName}
                                >
                                    <option value="Active" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100">Active</option>
                                    <option value="Inactive" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100">Inactive</option>
                                </select>
                            </FormField>
                        </div>
                    </div>

                    {/* Section 2: Role & Access */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
                        <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                    Role & Access
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Select the user's system access level
                                </p>
                            </div>
                        </div>

                        <FormField label="User Role" required>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className={inputClassName}
                            >
                                {roles.map((role) => (
                                    <option key={role} value={role} className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100">
                                        {role}
                                    </option>
                                ))}
                            </select>
                        </FormField>

                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                Access Summary
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                                {formData.role === "Admin / Owner"
                                    ? "Full access to all modules, settings and user management."
                                    : formData.role === "Manager"
                                    ? "Access to business operations, inventory, sales, purchases, suppliers and customers."
                                    : "Access to POS billing, customers and sales history."}
                            </p>
                        </div>
                    </div>

                    {/* Section 3: Credentials & Authorization */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
                        <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                                <Lock size={20} />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                    Login Credentials & Authorization
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Set initial user credentials and authenticate with Admin passcode
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            <FormField label="User Password" required>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Min 6 characters"
                                    className={inputClassName}
                                />
                            </FormField>

                            <FormField label="Confirm Password" required>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Re-enter password"
                                    className={inputClassName}
                                />
                            </FormField>

                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-col-reverse items-center justify-end gap-3 pt-2 sm:flex-row">
                        <Link
                            to="/users"
                            className="w-full rounded-xl border border-slate-300 px-6 py-2.5 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 sm:w-auto"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95 dark:bg-emerald-600 dark:hover:bg-emerald-500 sm:w-auto"
                        >
                            <Save size={18} />
                            <span>Save User</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function FormField({ label, required, children }) {
    return (
        <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {label}
                {required && <span className="ml-1 text-rose-500">*</span>}
            </label>
            {children}
        </div>
    );
}
