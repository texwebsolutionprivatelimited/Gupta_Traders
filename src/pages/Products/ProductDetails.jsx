import { useEffect, useState } from "react";
import {
    Link,
    useParams,
} from "react-router-dom";
import {
    ArrowLeft,
    Pencil,
    Package,
    Barcode,
} from "lucide-react";

import ProductCard from "../../components/products/ProductCard";

export default function ProductDetails() {
    const { id } = useParams();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedProducts =
            localStorage.getItem(
                "gupta_traders_products"
            );

        if (!storedProducts) {
            setLoading(false);
            return;
        }

        const products = JSON.parse(storedProducts);

        const foundProduct = products.find(
            (item) => String(item.id) === String(id)
        );

        setProduct(foundProduct || null);
        setLoading(false);
    }, [id]);

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <p className="text-slate-400">
                    Loading product...
                </p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="p-6">
                <div className="mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center">
                    <h1 className="text-2xl font-bold text-white">
                        Product Not Found
                    </h1>

                    <Link
                        to="/products"
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-medium text-white hover:bg-emerald-700"
                    >
                        <ArrowLeft size={18} />
                        Back to Products
                    </Link>
                </div>
            </div>
        );
    }

    const stock = Number(product.stock || 0);
    const minStock = Number(
        product.minStock || 10
    );

    const purchasePrice = Number(
        product.purchasePrice || 0
    );

    const sellingPrice = Number(
        product.sellingPrice || 0
    );

    const profitPerUnit =
        sellingPrice - purchasePrice;

    const inventoryValue =
        purchasePrice * stock;

    const expectedRevenue =
        sellingPrice * stock;

    const expectedProfit =
        profitPerUnit * stock;

    let stockStatus = "In Stock";

    if (stock === 0) {
        stockStatus = "Out of Stock";
    } else if (stock <= minStock) {
        stockStatus = "Low Stock";
    }

    const stockStatusClass =
        stockStatus === "Out of Stock"
            ? "border-red-500/20 bg-red-500/10 text-red-400"
            : stockStatus === "Low Stock"
            ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
            : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

    const identifier =
        product.productType === "Loose"
            ? product.productCode
            : product.sku;

    return (
        <div className="p-6">
            <div className="mx-auto max-w-7xl">

                {/* Header */}
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-white">
                                {product.name}
                            </h1>

                            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                                {product.productType}
                            </span>
                        </div>

                        <p className="mt-2 text-slate-400">
                            {product.productType ===
                            "Loose"
                                ? "Product Code"
                                : "SKU"}
                            : {identifier}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Link
                            to={`/products/edit/${id}`}
                            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 font-medium text-black transition hover:bg-amber-400"
                        >
                            <Pencil size={18} />
                            Edit Product
                        </Link>

                        <Link
                            to="/products"
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-2.5 font-medium text-slate-300 transition hover:bg-slate-800"
                        >
                            <ArrowLeft size={18} />
                            Back
                        </Link>
                    </div>
                </div>

                {/* Main Card */}
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">

                    {/* Status */}
                    <div className="mb-6 flex flex-wrap items-center gap-3">
                        <span
                            className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${stockStatusClass}`}
                        >
                            {stockStatus}
                        </span>

                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300">
                            {product.productType ===
                            "Loose" ? (
                                <ScaleIcon />
                            ) : (
                                <Package
                                    size={16}
                                />
                            )}

                            {product.productType}
                        </span>
                    </div>

                    {/* Product Information */}
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

                        <ProductCard
                            title="Product Name"
                            value={product.name}
                        />

                        <ProductCard
                            title={
                                product.productType ===
                                "Loose"
                                    ? "Product Code"
                                    : "SKU"
                            }
                            value={identifier}
                        />

                        <ProductCard
                            title="Barcode"
                            value={product.barcode}
                            icon={
                                <Barcode size={18} />
                            }
                        />

                        <ProductCard
                            title="Category"
                            value={product.category}
                        />

                        {product.productType ===
                            "Packaged" && (
                            <ProductCard
                                title="Brand"
                                value={
                                    product.brand
                                }
                            />
                        )}

                        <ProductCard
                            title="Unit"
                            value={product.unit}
                        />

                        <ProductCard
                            title="Purchase Price"
                            value={`₹${purchasePrice.toLocaleString(
                                "en-IN"
                            )}`}
                        />

                        <ProductCard
                            title="Selling Price"
                            value={`₹${sellingPrice.toLocaleString(
                                "en-IN"
                            )}`}
                        />

                        <ProductCard
                            title="GST"
                            value={`${product.gst}%`}
                        />

                        <ProductCard
                            title="Current Stock"
                            value={`${stock} ${product.unit}`}
                        />

                        <ProductCard
                            title="Minimum Stock"
                            value={`${minStock} ${product.unit}`}
                        />
                    </div>

                    {/* Description */}
                    <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-800/40 p-5">
                        <h3 className="mb-3 text-lg font-semibold text-white">
                            Description
                        </h3>

                        <p className="leading-relaxed text-slate-300">
                            {product.description ||
                                "No description available."}
                        </p>
                    </div>

                    {/* Analytics */}
                    <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">

                        <AnalyticsCard
                            title="Profit Per Unit"
                            value={`₹${profitPerUnit.toLocaleString(
                                "en-IN"
                            )}`}
                            className="border-emerald-500/20 bg-emerald-500/10"
                            textClass="text-emerald-400"
                        />

                        <AnalyticsCard
                            title="Inventory Value"
                            value={`₹${inventoryValue.toLocaleString(
                                "en-IN"
                            )}`}
                            className="border-blue-500/20 bg-blue-500/10"
                            textClass="text-blue-400"
                        />

                        <AnalyticsCard
                            title="Expected Revenue"
                            value={`₹${expectedRevenue.toLocaleString(
                                "en-IN"
                            )}`}
                            className="border-violet-500/20 bg-violet-500/10"
                            textClass="text-violet-400"
                        />

                        <AnalyticsCard
                            title="Expected Profit"
                            value={`₹${expectedProfit.toLocaleString(
                                "en-IN"
                            )}`}
                            className="border-green-500/20 bg-green-500/10"
                            textClass="text-green-400"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function AnalyticsCard({
    title,
    value,
    className,
    textClass,
}) {
    return (
        <div
            className={`rounded-2xl border p-5 ${className}`}
        >
            <p className={`text-sm ${textClass}`}>
                {title}
            </p>

            <h3 className="mt-2 text-2xl font-bold text-white">
                {value}
            </h3>
        </div>
    );
}

function ScaleIcon() {
    return (
        <span className="text-sm font-bold">
            KG
        </span>
    );
}