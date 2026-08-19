import { useState } from "react";
import {
  FolderOpen,
  Pencil,
  Trash2,
  Plus,
  Search,
  Package,
  X,
  Layers3,
  Boxes,
} from "lucide-react";

export default function Categories() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [categories, setCategories] = useState([
    {
      id: 1,
      name: "Grocery",
      description: "General grocery products",
      products: 12,
    },
    {
      id: 2,
      name: "Rice",
      description: "All types of rice products",
      products: 8,
    },
    {
      id: 3,
      name: "Pulses",
      description: "Dal and pulses products",
      products: 10,
    },
    {
      id: 4,
      name: "Flour",
      description: "Atta and flour products",
      products: 15,
    },
    {
      id: 5,
      name: "Sugar",
      description: "Sugar and sweetening products",
      products: 7,
    },
    {
      id: 6,
      name: "Oil",
      description: "Cooking oil and edible oils",
      products: 11,
    },
    {
      id: 7,
      name: "Snacks",
      description: "Snacks and packaged food",
      products: 18,
    },
    {
      id: 8,
      name: "Beverages",
      description: "Cold drinks and juices",
      products: 14,
    },
    {
      id: 9,
      name: "Household",
      description: "Cleaning products",
      products: 9,
    },
  ]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalProducts = categories.reduce(
    (sum, item) => sum + item.products,
    0
  );

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
    });

    setEditingId(null);
    setIsEditing(false);
  };

  const handleSaveCategory = () => {
    if (!formData.name.trim()) return;

    if (isEditing) {
      setCategories((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
              ...item,
              name: formData.name,
              description: formData.description,
            }
            : item
        )
      );
    } else {
      const newCategory = {
        id: Date.now(),
        name: formData.name,
        description: formData.description,
        products: 0,
      };

      setCategories((prev) => [...prev, newCategory]);
    }

    resetForm();
    setShowModal(false);
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      description: category.description,
    });

    setEditingId(category.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this category?"
    );

    if (!confirmDelete) return;

    setCategories((prev) =>
      prev.filter((item) => item.id !== id)
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-950 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <h1
               className="text-3xl font-bold text-slate-100"
            >
              Categories
            </h1>

            <p className="mt-2 text-gray-600 dark:text-slate-400">
              Manage all product categories
            </p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-medium text-white transition hover:bg-emerald-500"
          >
            <Plus size={18} />
            Add Category
          </button>
        </div>

        {/* Statistics */}


        {/* Search */}

        <div className="mb-8 rounded-3xl border border-gray-200 bg-white p-4 shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="relative">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            />

            <input
              type="text"
              placeholder="Search category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 text-slate-400"
            />
          </div>
        </div>
        {/* Categories Grid */}

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
            >
              {/* Top Section */}

              <div className="mb-5 flex items-start justify-between">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <FolderOpen
                    size={28}
                    className="text-emerald-500"
                  />
                </div>

                <div className="flex gap-2">

                  <button
                    onClick={() => handleEdit(category)}
                    className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2 text-amber-500 transition hover:bg-amber-500/20"
                  >
                    <Pencil size={18} />
                  </button>

                  <button
                    onClick={() => handleDelete(category.id)}
                    className="rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-red-500 transition hover:bg-red-500/20"
                  >
                    <Trash2 size={18} />
                  </button>

                </div>
              </div>

              {/* Category Name */}

              <h3 className="text-2xl font-semibold text-gray-900 dark:text-slate-400">
                {category.name}
              </h3>

              {/* Description */}

              <p className="mt-3 min-h-[48px] text-gray-600 dark:text-slate-400">
                {category.description}
              </p>

              {/* Product Count */}

              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-slate-800">

                <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
                  <Package size={16} />
                  Products
                </div>

                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 font-semibold text-emerald-600">
                  {category.products}
                </span>

              </div>

              {/* Footer Badge */}

              <div className="mt-4">
                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                  Active Category
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}

        {filteredCategories.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white py-16 shadow-sm dark:border-slate-700 dark:bg-slate-900">

            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800">
              <FolderOpen
                size={40}
                className="text-gray-400"
              />
            </div>

            <h3 className="mt-5 text-xl font-semibold text-gray-800 dark:text-white">
              No Categories Found
            </h3>

            <p className="mt-2 text-center text-gray-500 dark:text-slate-400">
              No category matches your search.
              <br />
              Try another keyword or add a new category.
            </p>

            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-medium text-white transition hover:bg-emerald-500"
            >
              <Plus size={18} />
              Add Category
            </button>

          </div>
        )}
        {/* Add / Edit Modal */}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

            <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">

              {/* Modal Header */}

              <div className="mb-6 flex items-center justify-between">

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isEditing ? "Edit Category" : "Add Category"}
                </h2>

                <button
                  onClick={() => {
                    resetForm();
                    setShowModal(false);
                  }}
                  className="rounded-xl p-2 transition hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  <X
                    size={20}
                    className="text-gray-600 dark:text-slate-300"
                  />
                </button>

              </div>

              {/* Form */}

              <div className="space-y-4">

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Category Name
                  </label>

                  <input
                    type="text"
                    placeholder="Enter category name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Description
                  </label>

                  <textarea
                    rows={4}
                    placeholder="Enter category description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    className="w-full resize-none rounded-xl border border-gray-300 bg-white p-3 text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Action Buttons */}

                <div className="flex gap-3 pt-2">

                  <button
                    onClick={() => {
                      resetForm();
                      setShowModal(false);
                    }}
                    className="flex-1 rounded-xl border border-gray-300 bg-white py-3 font-medium text-gray-700 transition hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleSaveCategory}
                    disabled={!formData.name.trim()}
                    className="flex-1 rounded-xl bg-emerald-600 py-3 font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isEditing
                      ? "Update Category"
                      : "Save Category"}
                  </button>

                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}