import { useEffect, useState } from "react";
import { Save, Package, Scale } from "lucide-react";

const categories = [
    "Grocery",
    "Rice",
    "Pulses",
    "Flour",
    "Sugar",
    "Oil",
    "Snacks",
    "Beverages",
    "Personal Care",
    "Household",
];

const units = [
    "Kg",
    "Gram",
    "Litre",
    "Ml",
    "Piece",
    "Packet",
    "Box",
    "Dozen",
];

const initialProduct = {
    productType: "Packaged",

    name: "",
    sku: "",
    productCode: "",
    barcode: "",

    category: "",
    brand: "",

    unit: "",
    purchasePrice: "",
    sellingPrice: "",
    gst: "",
    stock: "",
    minStock: "",

    description: "",
};

export default function ProductForm({
    initialData = null,
    onSubmit,
    submitText = "Save Product",
}) {
    const [product, setProduct] = useState(initialProduct);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (initialData) {
            setProduct({
                ...initialProduct,
                ...initialData,
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setProduct((prev) => ({
            ...prev,
            [name]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [name]: "",
        }));
    };

    const handleProductTypeChange = (type) => {
        setProduct((prev) => ({
            ...prev,
            productType: type,

            // Packaged fields
            sku: type === "Packaged" ? prev.sku : "",
            brand: type === "Packaged" ? prev.brand : "",

            // Loose field
            productCode: type === "Loose" ? prev.productCode : "",
        }));

        setErrors({});
    };

    const validateForm = () => {
        const newErrors = {};

        if (!product.name.trim()) {
            newErrors.name = "Product name is required";
        }

        if (product.productType === "Packaged") {
            if (!product.sku.trim()) {
                newErrors.sku = "SKU is required";
            }

            if (!product.brand.trim()) {
                newErrors.brand = "Brand is required";
            }
        }

        if (product.productType === "Loose") {
            if (!product.productCode.trim()) {
                newErrors.productCode = "Product code is required";
            }
        }

        if (!product.barcode.trim()) {
            newErrors.barcode = "Barcode is required";
        }

        if (!product.category) {
            newErrors.category = "Category is required";
        }

        if (!product.unit) {
            newErrors.unit = "Unit is required";
        }

        if (
            product.purchasePrice === "" ||
            Number(product.purchasePrice) < 0
        ) {
            newErrors.purchasePrice = "Purchase price is required";
        }

        if (
            product.sellingPrice === "" ||
            Number(product.sellingPrice) < 0
        ) {
            newErrors.sellingPrice = "Selling price is required";
        }

        if (
            product.gst === "" ||
            Number(product.gst) < 0 ||
            Number(product.gst) > 100
        ) {
            newErrors.gst = "Enter valid GST percentage";
        }

        if (
            product.stock === "" ||
            Number(product.stock) < 0
        ) {
            newErrors.stock = "Current stock is required";
        }

        if (
            product.minStock === "" ||
            Number(product.minStock) < 0
        ) {
            newErrors.minStock = "Minimum stock is required";
        }

        if (!product.description.trim()) {
            newErrors.description = "Description is required";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const formattedProduct = {
            ...product,
            purchasePrice: Number(product.purchasePrice),
            sellingPrice: Number(product.sellingPrice),
            gst: Number(product.gst),
            stock: Number(product.stock),
            minStock: Number(product.minStock),
        };

        onSubmit(formattedProduct);
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl"
        >
            {/* Product Type */}
            <div className="mb-8">
                <label className="mb-3 block text-sm font-medium text-slate-300">
                    Product Type
                    <span className="ml-1 text-red-500">*</span>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={() =>
                            handleProductTypeChange("Packaged")
                        }
                        className={`flex items-center gap-4 rounded-2xl border p-5 text-left transition ${
                            product.productType === "Packaged"
                                ? "border-emerald-500 bg-emerald-500/10"
                                : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                        }`}
                    >
                        <div
                            className={`rounded-xl p-3 ${
                                product.productType === "Packaged"
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-slate-700 text-slate-400"
                            }`}
                        >
                            <Package size={24} />
                        </div>

                        <div>
                            <p className="font-semibold text-slate-50">
                                Packaged Product
                            </p>

                            <p className="mt-1 text-sm text-slate-400">
                                SKU + Brand based product
                            </p>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            handleProductTypeChange("Loose")
                        }
                        className={`flex items-center gap-4 rounded-2xl border p-5 text-left transition ${
                            product.productType === "Loose"
                                ? "border-emerald-500 bg-emerald-500/10"
                                : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                        }`}
                    >
                        <div
                            className={`rounded-xl p-3 ${
                                product.productType === "Loose"
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-slate-700 text-slate-400"
                            }`}
                        >
                            <Scale size={24} />
                        </div>

                        <div>
                            <p className="font-semibold text-slate-50">
                                Loose Product
                            </p>

                            <p className="mt-1 text-sm text-slate-400">
                                Product Code based product
                            </p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Basic Information */}
            <div className="mb-8">
                <h2 className="mb-5 text-lg font-semibold text-slate-400">
                    Product Information
                </h2>

                <div className="grid gap-5 md:grid-cols-2">
                    <Input
                        label="Product Name"
                        name="name"
                        value={product.name}
                        onChange={handleChange}
                        error={errors.name}
                    />

                    {product.productType === "Packaged" ? (
                        <>
                            <Input
                                label="SKU"
                                name="sku"
                                value={product.sku}
                                onChange={handleChange}
                                error={errors.sku}
                            />

                            <Input
                                label="Brand"
                                name="brand"
                                value={product.brand}
                                onChange={handleChange}
                                error={errors.brand}
                            />
                        </>
                    ) : (
                        <Input
                            label="Product Code"
                            name="productCode"
                            value={product.productCode}
                            onChange={handleChange}
                            error={errors.productCode}
                        />
                    )}

                    <Input
                        label="Barcode"
                        name="barcode"
                        value={product.barcode}
                        onChange={handleChange}
                        error={errors.barcode}
                    />

                    {/* Category */}
                    <Select
                        label="Category"
                        name="category"
                        value={product.category}
                        onChange={handleChange}
                        options={categories}
                        error={errors.category}
                    />

                    {/* Unit */}
                    <Select
                        label="Unit"
                        name="unit"
                        value={product.unit}
                        onChange={handleChange}
                        options={units}
                        error={errors.unit}
                    />
                </div>
            </div>

            {/* Pricing */}
            <div className="mb-8">
                <h2 className="mb-5 text-lg font-semibold text-slate-400">
                    Pricing & Tax
                </h2>

                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    <Input
                        label="Purchase Price"
                        name="purchasePrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={product.purchasePrice}
                        onChange={handleChange}
                        error={errors.purchasePrice}
                    />

                    <Input
                        label="Selling Price"
                        name="sellingPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={product.sellingPrice}
                        onChange={handleChange}
                        error={errors.sellingPrice}
                    />

                    <Input
                        label="GST %"
                        name="gst"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={product.gst}
                        onChange={handleChange}
                        error={errors.gst}
                    />
                </div>
            </div>

            {/* Inventory */}
            <div className="mb-8">
                <h2 className="mb-5 text-lg font-semibold text-slate-400">
                    Inventory
                </h2>

                <div className="grid gap-5 md:grid-cols-2">
                    <Input
                        label="Current Stock"
                        name="stock"
                        type="number"
                        min="0"
                        step="0.01"
                        value={product.stock}
                        onChange={handleChange}
                        error={errors.stock}
                    />

                    <Input
                        label="Minimum Stock"
                        name="minStock"
                        type="number"
                        min="0"
                        step="0.01"
                        value={product.minStock}
                        onChange={handleChange}
                        error={errors.minStock}
                    />
                </div>
            </div>

            {/* Description */}
            <div className="mb-8">
                <label className="mb-2 block text-sm font-medium text-slate-300">
                    Description
                    <span className="ml-1 text-red-500">*</span>
                </label>

                <textarea
                    name="description"
                    rows={5}
                    value={product.description}
                    onChange={handleChange}
                    placeholder="Enter product description..."
                    className={`w-full rounded-xl border bg-slate-800 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-500 ${
                        errors.description
                            ? "border-red-500"
                            : "border-slate-700"
                    }`}
                />

                {errors.description && (
                    <p className="mt-1 text-xs text-red-400">
                        {errors.description}
                    </p>
                )}
            </div>

            {/* Submit */}
            <div className="flex justify-end border-t border-slate-800 pt-6">
                <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
                >
                    <Save size={18} />
                    {submitText}
                </button>
            </div>
        </form>
    );
}

function Input({
    label,
    name,
    value,
    onChange,
    error,
    type = "text",
    min,
    max,
    step,
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
                {label}
                <span className="ml-1 text-red-500">*</span>
            </label>

            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                min={min}
                max={max}
                step={step}
                placeholder={`Enter ${label.toLowerCase()}`}
                className={`w-full rounded-xl border bg-slate-800 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-500 ${
                    error
                        ? "border-red-500"
                        : "border-slate-700"
                }`}
            />

            {error && (
                <p className="mt-1 text-xs text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
}

function Select({
    label,
    name,
    value,
    onChange,
    options,
    error,
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
                {label}
                <span className="ml-1 text-red-500">*</span>
            </label>

            <select
                name={name}
                value={value}
                onChange={onChange}
                className={`w-full rounded-xl border bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-emerald-500 ${
                    error
                        ? "border-red-500"
                        : "border-slate-700"
                }`}
            >
                <option value="">
                    Select {label}
                </option>

                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>

            {error && (
                <p className="mt-1 text-xs text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
}