
import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  ArrowLeft,
  Save,
  UserRound,
  ShieldCheck,
} from "lucide-react";

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
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const users =
        JSON.parse(localStorage.getItem("users")) || [];

      const user = users.find(
        (item) => String(item.id) === String(id)
      );

      if (!user) {
        setError("User not found.");
        setLoading(false);
        return;
      }

      setFormData({
        name: user.name || "",
        email: user.email || "",
        mobile: user.mobile || "",
        role: user.role || "Cashier / Accountant",
        status: user.status || "Active",
        password: user.password || "",
        confirmPassword: user.password || "",
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
      setError("Please enter email.");
      return;
    }

    if (
      !formData.mobile ||
      formData.mobile.length !== 10
    ) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (
      formData.password &&
      formData.password.length < 6
    ) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (
      formData.password !== formData.confirmPassword
    ) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const users =
        JSON.parse(localStorage.getItem("users")) || [];

      const emailExists = users.some(
        (user) =>
          String(user.id) !== String(id) &&
          user.email?.toLowerCase() ===
            formData.email.toLowerCase()
      );

      if (emailExists) {
        setError(
          "Another user already uses this email."
        );
        return;
      }

      const mobileExists = users.some(
        (user) =>
          String(user.id) !== String(id) &&
          user.mobile === formData.mobile
      );

      if (mobileExists) {
        setError(
          "Another user already uses this mobile number."
        );
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
          password: formData.password,
        };
      });

      localStorage.setItem(
        "users",
        JSON.stringify(updatedUsers)
      );

      alert("User updated successfully!");

      navigate("/users");
    } catch (err) {
      console.error(err);
      setError("Failed to update user.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50 p-8 dark:bg-slate-950">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-slate-900">
          Loading user...
        </div>
      </div>
    );
  }

  if (error === "User not found.") {
    return (
      <div className="min-h-full bg-slate-50 p-8 dark:bg-slate-950">
        <div className="mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-white p-8 text-center dark:border-rose-500/20 dark:bg-slate-900">
          <h1 className="text-xl font-bold">
            User Not Found
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            The requested user does not exist.
          </p>

          <Link
            to="/users"
            className="mt-5 inline-flex rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white"
          >
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 text-slate-900 dark:bg-slate-950 dark:text-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">

        <Link
          to="/users"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-emerald-500"
        >
          <ArrowLeft size={17} />
          Back to Users
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-blue-500/10 p-3 text-blue-500">
            <UserRound size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              Edit User
            </h1>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Update user information and permissions.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7"
        >
          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
              {error}
            </div>
          )}

          <div className="mb-8">
            <h2 className="mb-5 text-lg font-semibold">
              User Information
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Full Name" required>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                />
              </FormField>

              <FormField label="Email Address" required>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
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
                  }}
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
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </FormField>
            </div>
          </div>

          <div className="mb-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-violet-500/10 p-3 text-violet-500">
                <ShieldCheck size={20} />
              </div>

              <div>
                <h2 className="font-semibold">
                  Role & Access
                </h2>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Change the user's system role.
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
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="mb-8">
            <h2 className="mb-5 text-lg font-semibold">
              Login Security
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Password">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  className="input-field"
                />
              </FormField>

              <FormField label="Confirm Password">
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

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 dark:border-slate-800 sm:flex-row sm:justify-end">
            <Link
              to="/users"
              className="rounded-xl border border-slate-300 px-6 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              <Save size={18} />
              Update User
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .input-field {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(203 213 225);
          background: white;
          padding: 0.7rem 0.9rem;
          font-size: 0.875rem;
          color: rgb(15 23 42);
          outline: none;
        }

        .input-field:focus {
          border-color: rgb(16 185 129);
          box-shadow: 0 0 0 2px rgb(16 185 129 / 0.12);
        }

        .dark .input-field {
          border-color: rgb(51 65 85);
          background: rgb(30 41 59);
          color: white;
        }

        .dark .input-field::placeholder {
          color: rgb(100 116 139);
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

