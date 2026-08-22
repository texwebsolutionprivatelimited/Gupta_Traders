import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  ShieldCheck,
  UserRound,
  Users,
  CheckCircle2,
} from "lucide-react";

const initialUsers = [
  {
    id: 1,
    name: "Sanjana Yadav",
    email: "admin@guptatraders.com",
    mobile: "9876543210",
    role: "Admin / Owner",
    status: "Active",
  },
  {
    id: 2,
    name: "Amit Kumar",
    email: "manager@guptatraders.com",
    mobile: "9123456780",
    role: "Manager",
    status: "Active",
  },
  {
    id: 3,
    name: "Rahul Singh",
    email: "cashier@guptatraders.com",
    mobile: "9988776655",
    role: "Cashier / Accountant",
    status: "Active",
  },
];

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

export default function UserManagement() {
  const navigate = useNavigate();

  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem("users");

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    }

    localStorage.setItem("users", JSON.stringify(initialUsers));
    return initialUsers;
  });

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredUsers = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    return users.filter((user) => {
      const matchesSearch =
        !searchText ||
        String(user.name || "")
          .toLowerCase()
          .includes(searchText) ||
        String(user.email || "")
          .toLowerCase()
          .includes(searchText) ||
        String(user.mobile || "").includes(searchText);

      const matchesRole =
        roleFilter === "All" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "All" || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const activeUsers = users.filter(
    (user) => user.status === "Active"
  ).length;

  const managerUsers = users.filter(
    (user) => user.role === "Manager"
  ).length;

  const cashierUsers = users.filter(
    (user) => user.role === "Cashier / Accountant"
  ).length;

  const adminUsers = users.filter(
    (user) => user.role === "Admin / Owner"
  ).length;

  const handleDelete = (id) => {
    const user = users.find((item) => item.id === id);

    if (!user) return;

    if (user.role === "Admin / Owner") {
      const adminCount = users.filter(
        (item) => item.role === "Admin / Owner"
      ).length;

      if (adminCount <= 1) {
        alert("At least one Admin / Owner must remain.");
        return;
      }
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name}?`
    );

    if (!confirmed) return;

    const updatedUsers = users.filter(
      (item) => item.id !== id
    );

    setUsers(updatedUsers);
    localStorage.setItem(
      "users",
      JSON.stringify(updatedUsers)
    );
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span>Users</span>
              <span>/</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                User Management
              </span>
            </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">

              User Management
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage users, roles and system permissions.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("/users/permissions")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <ShieldCheck size={18} />
              Role & Permissions
            </button>

            <button
              type="button"
              onClick={() => navigate("/users/add")}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              <Plus size={18} />
              Add User
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Users"
            value={users.length}
            subtitle="All registered users"
            icon={<Users size={21} />}
            iconClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          />

          <StatCard
            title="Active Users"
            value={activeUsers}
            subtitle="Currently active"
            icon={<CheckCircle2 size={21} />}
            iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />

          <StatCard
            title="Managers"
            value={managerUsers}
            subtitle="Manager accounts"
            icon={<ShieldCheck size={21} />}
            iconClass="bg-violet-500/10 text-violet-600 dark:text-violet-400"
          />

          <StatCard
            title="Cashier / Accountant"
            value={cashierUsers}
            subtitle="Billing accounts"
            icon={<UserRound size={21} />}
            iconClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          />
        </div>

        {/* Role Summary */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <RoleCard
            role="Admin / Owner"
            count={adminUsers}
            description="Full system access"
            permissions={rolePermissions["Admin / Owner"]}
            icon={<ShieldCheck size={20} />}
          />

          <RoleCard
            role="Manager"
            count={managerUsers}
            description="Business operations access"
            permissions={rolePermissions.Manager}
            icon={<Users size={20} />}
          />

          <RoleCard
            role="Cashier / Accountant"
            count={cashierUsers}
            description="Billing and customer access"
            permissions={rolePermissions["Cashier / Accountant"]}
            icon={<UserRound size={20} />}
          />
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px_180px]">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email or mobile..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-emerald-500"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-emerald-500"
            >
              <option value="All">All Roles</option>
              <option value="Admin / Owner">
                Admin / Owner
              </option>
              <option value="Manager">Manager</option>
              <option value="Cashier / Accountant">
                Cashier / Accountant
              </option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-emerald-500"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="px-5 py-4">User</th>
                  <th className="px-5 py-4">Mobile</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4 text-center">
                    Permissions
                  </th>
                  <th className="px-5 py-4 text-center">
                    Status
                  </th>
                  <th className="px-5 py-4 text-center">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={user.name} />

                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {user.name}
                            </p>

                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {user.email || "No email"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                        {user.mobile || "-"}
                      </td>

                      <td className="px-5 py-4">
                        <RoleBadge role={user.role} />
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {rolePermissions[user.role]?.length || 0} modules
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <StatusBadge status={user.status} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            title="View User"
                            onClick={() =>
                              navigate(`/users/${user.id}`)
                            }
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600 dark:text-slate-500 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                          >
                            <Eye size={18} />
                          </button>

                          <button
                            type="button"
                            title="Edit User"
                            onClick={() =>
                              navigate(`/users/edit/${user.id}`)
                            }
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600 dark:text-slate-500 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                          >
                            <Pencil size={18} />
                          </button>

                          <button
                            type="button"
                            title="Delete User"
                            onClick={() => handleDelete(user.id)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-5 py-12 text-center"
                    >
                      <UserRound
                        size={32}
                        className="mx-auto mb-2 text-slate-400 dark:text-slate-600"
                      />

                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        No users found
                      </p>

                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Try changing your search or filters.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconClass,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {subtitle}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${iconClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function RoleCard({
  role,
  count,
  description,
  permissions,
  icon,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
            {icon}
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{role}</h3>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>
        </div>

        <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {count}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {permissions.slice(0, 6).map((permission) => (
          <span
            key={permission}
            className="rounded-lg border border-slate-100 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
          >
            {permission}
          </span>
        ))}

        {permissions.length > 6 && (
          <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            +{permissions.length - 6} more
          </span>
        )}
      </div>
    </div>
  );
}

function UserAvatar({ name }) {
  const initials = String(name || "User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white shadow-sm">
      {initials || "U"}
    </div>
  );
}

function RoleBadge({ role }) {
  const classes = {
    "Admin / Owner":
      "bg-violet-500/10 text-violet-700 border border-violet-200 dark:border-violet-900/40 dark:text-violet-400",
    Manager:
      "bg-blue-500/10 text-blue-700 border border-blue-200 dark:border-blue-900/40 dark:text-blue-400",
    "Cashier / Accountant":
      "bg-amber-500/10 text-amber-700 border border-amber-200 dark:border-amber-900/40 dark:text-amber-400",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        classes[role] ||
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
      }`}
    >
      {role}
    </span>
  );
}

function StatusBadge({ status }) {
  const active = status === "Active";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-slate-400 dark:bg-slate-500"
        }`}
      />

      {status}
    </span>
  );
}