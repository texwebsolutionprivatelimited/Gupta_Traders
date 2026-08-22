import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    UserPlus,
    Save,
    ShieldCheck,
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

    const handleSubmit = (e) => {
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
            setError("Password must be at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        let users = [];

        try {
            users = JSON.parse(localStorage.getItem("users")) || [];
        } catch {
            users = [];
        }

        const emailExists = users.some(
            (user) =>
                user.email?.toLowerCase() === email.toLowerCase()
        );

        if (emailExists) {
            setError("A user with this email already exists.");
            return;
        }

        const mobileExists = users.some(
            (user) => user.mobile === mobile
        );

        if (mobileExists) {
            setError("A user with this mobile number already exists.");
            return;
        }

        const newUser = {
            id: Date.now(),
            name: name.trim(),
            email: email.trim(),
            mobile: mobile.trim(),
            role,
            status,
            password,
            createdAt: new Date().toISOString(),
        };

        const updatedUsers = [...users, newUser];

        localStorage.setItem(
            "users",
            JSON.stringify(updatedUsers)
        );

        alert("User added successfully!");

        navigate("/users");
    };

    return (
        <div className="min-h-full bg-slate-50 p-4 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-4xl">

                {/* Header */}
                <div className="mb-6">
                    <Link
                        to="/users"
                        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                    >
                        <ArrowLeft size={17} />
                        Back to Users
                    </Link>

                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
                            <UserPlus size={24} />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                                Add User
                            </h1>

                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                Create a new system user and assign a role.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Card */}
                <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7"
                >
                    {error && (
                        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
                            {error}
                        </div>
                    )}

                    {/* Basic Information */}
                    <div className="mb-8">
                        <h2 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">
                            Basic Information
                        </h2>

                        <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
                            Enter the user's personal and contact details.
                        </p>

                        <div className="grid gap-5 md:grid-cols-2">
                            <FormField label="Full Name" required>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter full name"
                                    className="input-field"
                                />
                            </FormField>

                            <FormField label="Email Address" required>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="user@example.com"
                                    className="input-field"
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
                                    className="input-field"
                                />
                            </FormField>

                            <FormField label="Status">
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="input-field"
                                >
                                    <option value="Active" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Active</option>
                                    <option value="Inactive" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Inactive</option>
                                </select>
                            </FormField>
                        </div>
                    </div>

                    {/* Role */}
                    <div className="mb-8">
                        <div className="mb-5 flex items-center gap-3">
                            <div className="rounded-xl bg-violet-500/10 p-2.5 text-violet-600 dark:text-violet-400">
                                <ShieldCheck size={20} />
                            </div>

                            <div>
                                <h2 className="font-semibold text-slate-900 dark:text-white">
                                    Role & Access
                                </h2>

                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Select the user's access level.
                                </p>
                            </div>
                        </div>

                        <FormField label="User Role" required>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="input-field"
                            >
                                {roles.map((role) => (
                                    <option key={role} value={role} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                                        {role}
                                    </option>
                                ))}
                            </select>
                        </FormField>

                        <div className="mt-4 rounded-xl bg-slate-100 p-4 dark:bg-slate-800/60">
                            <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
                                Role Access
                            </p>

                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                {formData.role === "Admin / Owner"
                                    ? "Full access to all modules, settings and user management."
                                    : formData.role === "Manager"
                                    ? "Access to business operations, inventory, sales, purchases, suppliers and customers."
                                    : "Access to POS billing, customers and sales history."}
                            </p>
                        </div>
                    </div>

                    {/* Password */}
                    <div className="mb-8">
                        <h2 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">
                            Login Security
                        </h2>

                        <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
                            Create login credentials for this user.
                        </p>

                        <div className="grid gap-5 md:grid-cols-2">
                            <FormField label="Password" required>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Minimum 6 characters"
                                    className="input-field"
                                />
                            </FormField>

                            <FormField label="Confirm Password" required>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Re-enter password"
                                    className="input-field"
                                />
                            </FormField>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 dark:border-slate-800 sm:flex-row sm:justify-end">
                        <Link
                            to="/users"
                            className="rounded-xl border border-slate-300 px-6 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                        >
                            <Save size={18} />
                            Save User
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .input-field {
                    width: 100%;
                    border-radius: 0.75rem;
                    border: 1px solid rgb(226, 232, 240);
                    background-color: rgb(255, 255, 255);
                    padding: 0.7rem 0.9rem;
                    font-size: 0.875rem;
                    color: rgb(15, 23, 42);
                    outline: none;
                    transition: all 0.2s;
                }

                .input-field:focus {
                    border-color: rgb(16, 185, 129);
                    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.15);
                }

                .input-field::placeholder {
                    color: rgb(148, 163, 184);
                }

                .dark .input-field {
                    border-color: rgb(30, 41, 59);
                    background-color: rgb(15, 23, 42);
                    color: rgb(255, 255, 255);
                }

                .dark .input-field::placeholder {
                    color: rgb(100, 116, 139);
                }
            `}</style>
        </div>
    );
}

function FormField({ label, required, children }) {
    return (
        <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {label}

                {required && (
                    <span className="ml-1 text-rose-500">*</span>
                )}
            </label>

            {children}
        </div>
    );
}