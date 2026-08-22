
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  ShieldCheck,
  Mail,
  Phone,
  UserRound,
  CheckCircle2,
} from "lucide-react";

const rolePermissions = {
  "Admin / Owner": [
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
  ],

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

export default function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  let users = [];

  try {
    users = JSON.parse(localStorage.getItem("users")) || [];
  } catch {
    users = [];
  }

  const user = users.find(
    (item) => String(item.id) === String(id)
  );

  if (!user) {
    return (
      <div className="min-h-full bg-slate-50 p-8 dark:bg-slate-950">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <UserRound
            size={40}
            className="mx-auto mb-4 text-slate-400"
          />

          <h1 className="text-2xl font-bold">
            User Not Found
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            The requested user does not exist.
          </p>

          <Link
            to="/users"
            className="mt-6 inline-flex rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  const permissions =
    rolePermissions[user.role] || [];

  const initials = String(user.name || "User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  const handleDelete = () => {
    if (user.role === "Admin / Owner") {
      const adminCount = users.filter(
        (item) => item.role === "Admin / Owner"
      ).length;

      if (adminCount <= 1) {
        alert(
          "At least one Admin / Owner must remain."
        );
        return;
      }
    }

    const confirmed = window.confirm(
      `Delete ${user.name}?`
    );

    if (!confirmed) return;

    const updatedUsers = users.filter(
      (item) => String(item.id) !== String(id)
    );

    localStorage.setItem(
      "users",
      JSON.stringify(updatedUsers)
    );

    alert("User deleted successfully!");

    navigate("/users");
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 text-slate-900 dark:bg-slate-950 dark:text-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-6">
          <Link
            to="/users"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-500 hover:text-emerald-600"
          >
            <ArrowLeft size={17} />
            Back to Users
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <span>Users</span>
                <span>/</span>
                <span>{user.name}</span>
              </div>

              <h1 className="text-2xl font-bold sm:text-3xl">
                User Details
              </h1>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() =>
                  navigate(`/users/edit/${user.id}`)
                }
                className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-600"
              >
                <Pencil size={17} />
                Edit User
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-600"
              >
                <Trash2 size={17} />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Profile */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl font-bold text-white">
              {initials || "U"}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold">
                  {user.name}
                </h2>

                <StatusBadge status={user.status} />
              </div>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {user.role}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                User ID: {user.id}
              </p>
            </div>
          </div>
        </div>

        {/* Information */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">

          {/* Contact */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-5 text-lg font-semibold">
              Contact Information
            </h2>

            <div className="space-y-4">
              <InfoRow
                icon={<UserRound size={18} />}
                label="Full Name"
                value={user.name}
              />

              <InfoRow
                icon={<Mail size={18} />}
                label="Email Address"
                value={user.email || "-"}
              />

              <InfoRow
                icon={<Phone size={18} />}
                label="Mobile Number"
                value={user.mobile || "-"}
              />
            </div>
          </section>

          {/* Account */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-5 text-lg font-semibold">
              Account Information
            </h2>

            <div className="space-y-4">
              <InfoRow
                icon={<ShieldCheck size={18} />}
                label="Role"
                value={user.role}
              />

              <InfoRow
                icon={<CheckCircle2 size={18} />}
                label="Status"
                value={user.status}
              />

              <InfoRow
                icon={<UserRound size={18} />}
                label="Created"
                value={
                  user.createdAt
                    ? new Date(
                        user.createdAt
                      ).toLocaleDateString("en-IN")
                    : "Default User"
                }
              />
            </div>
          </section>
        </div>

        {/* Permissions */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-violet-500/10 p-3 text-violet-500">
              <ShieldCheck size={21} />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                Role Permissions
              </h2>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Modules available to this user.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {permissions.map((permission) => (
              <div
                key={permission}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium dark:border-slate-700 dark:bg-slate-800"
              >
                <CheckCircle2
                  size={17}
                  className="text-emerald-500"
                />

                {permission}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-slate-100 p-2 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        {icon}
      </div>

      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 text-sm font-semibold">
          {value}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const active = status === "Active";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-500/10 text-emerald-500"
          : "bg-slate-500/10 text-slate-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />

      {status}
    </span>
  );
}
