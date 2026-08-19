import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import ProductForm from "../../components/products/ProductForm";

export default function AddProduct() {
    const navigate = useNavigate();

    const handleSubmit = (product) => {
        const storedProducts =
            localStorage.getItem(
                "gupta_traders_products"
            );

        const products = storedProducts
            ? JSON.parse(storedProducts)
            : [];

        const newProduct = {
            ...product,
            id: Date.now(),
            createdAt: new Date().toISOString(),
        };

        const updatedProducts = [
            ...products,
            newProduct,
        ];

        localStorage.setItem(
            "gupta_traders_products",
            JSON.stringify(updatedProducts)
        );

        alert("Product Added Successfully");

        navigate("/products");
    };

    return (
        <div className="p-6">
            <div className="mx-auto max-w-6xl">

                {/* Header */}
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-400">
                            Add Product
                        </h1>

                        <p className="mt-1 text-slate-400">
                            Create a new product
                        </p>
                    </div>

                    <Link
                        to="/products"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-slate-300 transition hover:bg-slate-800"
                    >
                        <ArrowLeft size={18} />
                        Back
                    </Link>
                </div>

                {/* Form */}
                <ProductForm
                    onSubmit={handleSubmit}
                    submitText="Save Product"
                />
            </div>
        </div>
    );
}