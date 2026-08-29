import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, UserRound, ShieldCheck, Lock, AlertCircle } from "lucide-react";

const roles = [
  "Admin / Owner",
  "Manager",
  "Cashier / Accountant",
];

export default function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    role: "Cashier / Accountant",
    status: "Active",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [savedUserPassword, setSavedUserPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const users = JSON.parse(localStorage.getItem("users")) || [];
      const user = users.find((item) => String(item.id) === String(id));

      if (!user) {
        setError("User not found.");
        setLoading(false);
        return;
      }

      setSavedUserPassword(user.password || "");

      setFormData({
        name: user.name || "",
        email: user.email || "",
        mobile: user.mobile || "",
        role: user.role || "Cashier / Accountant",
        status: user.status || "Active",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to load user.");
      setLoading(false);
    }
  }, [id]);

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

    if (!formData.name.trim()) {
      setError("Please enter user name.");
      return;
    }

    if (!formData.email.trim()) {
      setError("Please enter email address.");
      return;
    }

    if (!formData.mobile || formData.mobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    // Mandatory Security Check: Current Password MUST be provided
    if (!formData.currentPassword) {
      setError("Please enter Current Password to save any changes.");
      return;
    }

    if (formData.currentPassword !== savedUserPassword) {
      setError("Incorrect Current Password. Access denied.");
      return;
    }

    // Optional New Password Logic
    let updatedPassword = savedUserPassword;

    if (formData.newPassword || formData.confirmPassword) {
      if (formData.newPassword.length < 6) {
        setError("New password must be at least 6 characters.");
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        setError("New Password and Confirm Password do not match.");
        return;
      }

      updatedPassword = formData.newPassword;
    }

    try {
      const users = JSON.parse(localStorage.getItem("users")) || [];

      const emailExists = users.some(
        (user) =>
          String(user.id) !== String(id) &&
          user.email?.toLowerCase() === formData.email.toLowerCase()
      );

      if (emailExists) {
        setError("Another user already uses this email.");
        return;
      }

      const mobileExists = users.some(
        (user) =>
          String(user.id) !== String(id) && user.mobile === formData.mobile
      );

      if (mobileExists) {
        setError("Another user already uses this mobile number.");
        return;
      }

      const updatedUsers = users.map((user) => {
        if (String(user.id) !== String(id)) {
          return user;
        }

        return {
          ...user,
          name: formData.name.trim(),
          email: formData.email.trim(),
          mobile: formData.mobile,
          role: formData.role,
          status: formData.status,
          password: updatedPassword,
        };
      });

      localStorage.setItem("users", JSON.stringify(updatedUsers));
      alert("User updated successfully!");
      navigate("/users");
    } catch (err) {
      console.error(err);
      setError("Failed to update user.");
    }
  };

  const inputClassName =
    "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20";

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent dark:border-emerald-500"></div>
          <span className="font-medium">Loading user details...</span>
        </div>
      </div>
    );
  }

  if (error === "User not found.") {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-md rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm dark:border-rose-900/30 dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
            <AlertCircle size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            User Not Found
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            The user you are trying to edit does not exist or was removed.
          </p>
          <Link
            to="/users"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Navigation back */}
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
              Edit User Profile
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage personal information, role-based access, and login security.
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

          {/* Section 1: User Details */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <UserRound size={20} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  User Details
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Basic contact details and current status
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <FormField label="Full Name" required>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={inputClassName}
                  placeholder="e.g. John Doe"
                />
              </FormField>

              <FormField label="Email Address" required>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={inputClassName}
                  placeholder="john@example.com"
                />
              </FormField>

              <FormField label="Mobile Number" required>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setFormData((prev) => ({ ...prev, mobile: value }));
                  }}
                  className={inputClassName}
                  placeholder="10-digit number"
                />
              </FormField>

              <FormField label="Account Status">
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={inputClassName}
                >
                  <option value="Active" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100">
                    Active
                  </option>
                  <option value="Inactive" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100">
                    Inactive
                  </option>
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
                  Role & Permissions
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Assign user roles to regulate system permissions
                </p>
              </div>
            </div>

            <FormField label="System Role" required>
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
          </div>

          {/* Section 3: Password Security */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                <Lock size={20} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Security Settings
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Current password is required to confirm profile updates
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <FormField label="Current Password" required>
                <input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter current password"
                  className={inputClassName}
                />
              </FormField>

              <FormField label="New Password">
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Leave blank to keep same"
                  className={inputClassName}
                />
              </FormField>

              <FormField label="Confirm New Password">
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter new password"
                  className={inputClassName}
                />
              </FormField>
            </div>
          </div>

          {/* Footer Action Buttons */}
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
              <span>Save Changes</span>
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