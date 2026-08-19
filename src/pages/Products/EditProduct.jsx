import { useEffect, useState } from "react";
import {
    Link,
    useNavigate,
    useParams,
} from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import ProductForm from "../../components/products/ProductForm";

export default function EditProduct() {
    const { id } = useParams();
    const navigate = useNavigate();

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

    const handleSubmit = (updatedProduct) => {
        const storedProducts =
            localStorage.getItem(
                "gupta_traders_products"
            );

        const products = storedProducts
            ? JSON.parse(storedProducts)
            : [];

        const updatedProducts = products.map(
            (item) =>
                String(item.id) === String(id)
                    ? {
                          ...updatedProduct,
                          id: item.id,
                          updatedAt:
                              new Date().toISOString(),
                      }
                    : item
        );

        localStorage.setItem(
            "gupta_traders_products",
            JSON.stringify(updatedProducts)
        );

        alert("Product Updated Successfully");

        navigate(`/products/${id}`);
    };

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

                    <p className="mt-2 text-slate-400">
                        The product you are trying to edit
                        does not exist.
                    </p>

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

    return (
        <div className="p-6">
            <div className="mx-auto max-w-6xl">

                {/* Header */}
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">
                            Edit Product
                        </h1>

                        <p className="mt-1 text-slate-400">
                            Update product information
                        </p>
                    </div>

                    <Link
                        to={`/products/${id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-slate-300 transition hover:bg-slate-800"
                    >
                        <ArrowLeft size={18} />
                        Back
                    </Link>
                </div>

                <ProductForm
                    initialData={product}
                    onSubmit={handleSubmit}
                    submitText="Update Product"
                />
            </div>
        </div>
    );
}