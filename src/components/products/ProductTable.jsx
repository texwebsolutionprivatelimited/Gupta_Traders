import { Link } from "react-router-dom";
import {
    Eye,
    Pencil,
    Trash2,
} from "lucide-react";

export default function ProductTable({
    products,
    onDelete,
}) {
    const getStatus = (product) => {
        if (Number(product.stock) === 0) {
            return "Out of Stock";
        }

        if (
            Number(product.stock) <=
            Number(product.minStock || 10)
        ) {
            return "Low Stock";
        }

        return "In Stock";
    };

    const getStatusBadge = (status) => {
        if (status === "In Stock") {
            return (
                <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
                    In Stock
                </span>
            );
        }

        if (status === "Low Stock") {
            return (
                <span className="inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-500">
                    Low Stock
                </span>
            );
        }

        return (
            <span className="inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-500">
                Out of Stock
            </span>
        );
    };

    if (products.length === 0) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-lg font-medium text-slate-700 dark:text-slate-400">
                    No products found
                </p>

                <p className="mt-2 text-sm text-slate-500">
                    Try searching with another keyword
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900/60">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px]">
                    <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-400">
                                Product
                            </th>

                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-400">
                                SKU / Code
                            </th>

                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-400">
                                Category
                            </th>

                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-400">
                                Price
                            </th>

                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-400">
                                Stock
                            </th>

                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-400">
                                Status
                            </th>

                            <th className="px-6 py-4 text-center text-sm font-semibold text-slate-600 dark:text-slate-400">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {products.map((product) => {
                            const status = getStatus(product);

                            const identifier =
                                product.productType === "Loose"
                                    ? product.productCode
                                    : product.sku;

                            return (
                                <tr
                                    key={product.id}
                                    className="
          border-b border-slate-200
          hover:bg-slate-50
          dark:border-slate-800
          dark:hover:bg-slate-800/40
          transition
        "
                                >
                                    {/* Product */}
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                                                {product.name}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                {product.productType} Product
                                            </p>
                                        </div>
                                    </td>

                                    {/* SKU / Code */}
                                    <td className="px-6 py-4 text-slate-700 dark:text-slate-200">
                                        {identifier || "-"}
                                    </td>

                                    {/* Category */}
                                    <td className="px-6 py-4">
                                        <span
                                            className="
              rounded-full
              bg-slate-100
              px-3 py-1
              text-xs
              text-slate-700
              dark:bg-slate-800
              dark:text-slate-200
            "
                                        >
                                            {product.category}
                                        </span>
                                    </td>
                                    {/* Price */}
                                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                                        ₹
                                        {Number(product.sellingPrice).toLocaleString("en-IN")}
                                    </td>

                                    {/* Stock */}
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                                        {product.stock} {product.unit}
                                    </td>

                                    {/* Status */}
                                    <td className="px-6 py-4">
                                        {getStatusBadge(status)}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            <Link
                                                to={`/products/${product.id}`}
                                                title="View Product"
                                                className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-2 text-blue-500 hover:bg-blue-500/20 transition"
                                            >
                                                <Eye size={18} />
                                            </Link>

                                            <Link
                                                to={`/products/edit/${product.id}`}
                                                title="Edit Product"
                                                className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2 text-amber-500 hover:bg-amber-500/20 transition"
                                            >
                                                <Pencil size={18} />
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={() => onDelete(product)}
                                                title="Delete Product"
                                                className="rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-red-500 hover:bg-red-500/20 transition"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}