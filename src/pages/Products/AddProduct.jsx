import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ProductForm from "../../components/products/ProductForm";

export default function AddProduct() {
  const navigate = useNavigate();

  const handleSubmit = (product) => {
    const storedProducts = localStorage.getItem("gupta_traders_products");
    const products = storedProducts ? JSON.parse(storedProducts) : [];

    const newProduct = {
      ...product,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };

    const updatedProducts = [...products, newProduct];

    localStorage.setItem(
      "gupta_traders_products",
      JSON.stringify(updatedProducts)
    );

    alert("Product Added Successfully");
    navigate("/products");
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
            Add Product
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Create a new product for inventory
          </p>
        </div>

        <Link
          to="/products"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <ArrowLeft size={18} />
          Back
        </Link>
      </div>

      {/* Single Clean Container without extra duplicate borders */}
      <div>
        <ProductForm
          onSubmit={handleSubmit}
          submitText="Save Product"
        />
      </div>
    </div>
  );
}