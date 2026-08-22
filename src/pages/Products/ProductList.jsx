import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Search,
    Plus,
} from "lucide-react";

import ProductTable from "../../components/products/ProductTable";

const defaultProducts = [
    {
        id: 1,
        productType: "Packaged",
        name: "Aashirvaad Atta",
        sku: "ATTA001",
        productCode: "",
        barcode: "8901725134567",
        category: "Flour",
        brand: "Aashirvaad",
        unit: "Kg",
        purchasePrice: 250,
        sellingPrice: 285,
        gst: 5,
        stock: 45,
        minStock: 10,
        description:
            "Premium quality whole wheat flour.",
    },
    {
        id: 2,
        productType: "Packaged",
        name: "India Gate Basmati Rice",
        sku: "RICE001",
        productCode: "",
        barcode: "8901234567890",
        category: "Rice",
        brand: "India Gate",
        unit: "Kg",
        purchasePrice: 170,
        sellingPrice: 195,
        gst: 5,
        stock: 35,
        minStock: 10,
        description:
            "Premium quality basmati rice.",
    },
    {
        id: 3,
        productType: "Loose",
        name: "Toor Dal",
        sku: "",
        productCode: "DAL001",
        barcode: "8909876543210",
        category: "Pulses",
        brand: "",
        unit: "Kg",
        purchasePrice: 135,
        sellingPrice: 155,
        gst: 5,
        stock: 8,
        minStock: 10,
        description:
            "High quality Toor Dal.",
    },
    {
        id: 4,
        productType: "Packaged",
        name: "Fortune Sunflower Oil",
        sku: "OIL001",
        productCode: "",
        barcode: "8901000000001",
        category: "Oil",
        brand: "Fortune",
        unit: "Litre",
        purchasePrice: 160,
        sellingPrice: 180,
        gst: 5,
        stock: 0,
        minStock: 10,
        description:
            "Refined sunflower cooking oil.",
    },
    {
        id: 5,
        productType: "Packaged",
        name: "Maggi Noodles",
        sku: "SNK001",
        productCode: "",
        barcode: "8901000000002",
        category: "Snacks",
        brand: "Maggi",
        unit: "Packet",
        purchasePrice: 12,
        sellingPrice: 14,
        gst: 5,
        stock: 120,
        minStock: 20,
        description:
            "Instant noodles.",
    },
    {
        id: 6,
        productType: "Packaged",
        name: "Coca Cola 1L",
        sku: "BEV001",
        productCode: "",
        barcode: "8901000000003",
        category: "Beverages",
        brand: "Coca Cola",
        unit: "Litre",
        purchasePrice: 55,
        sellingPrice: 65,
        gst: 5,
        stock: 50,
        minStock: 10,
        description:
            "Refreshing carbonated beverage.",
    },
];

export default function ProductList() {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const storedProducts =
            localStorage.getItem("gupta_traders_products");

        if (storedProducts) {
            setProducts(JSON.parse(storedProducts));
        } else {
            localStorage.setItem(
                "gupta_traders_products",
                JSON.stringify(defaultProducts)
            );

            setProducts(defaultProducts);
        }
    }, []);

    const filteredProducts = products.filter(
        (product) => {
            const query = search
                .toLowerCase()
                .trim();

            if (!query) {
                return true;
            }

            return (
                product.name
                    ?.toLowerCase()
                    .includes(query) ||
                product.sku
                    ?.toLowerCase()
                    .includes(query) ||
                product.productCode
                    ?.toLowerCase()
                    .includes(query) ||
                product.category
                    ?.toLowerCase()
                    .includes(query) ||
                product.brand
                    ?.toLowerCase()
                    .includes(query) ||
                product.barcode
                    ?.toLowerCase()
                    .includes(query)
            );
        }
    );

    const handleDelete = (product) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${product.name}"?`
        );

        if (!confirmed) {
            return;
        }

        const updatedProducts = products.filter(
            (item) => item.id !== product.id
        );

        setProducts(updatedProducts);

        localStorage.setItem(
            "gupta_traders_products",
            JSON.stringify(updatedProducts)
        );
    };

    return (
        <div className="p-2">
            <div className="mx-auto max-w-7xl">

                {/* Header */}
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-100">
                            Products
                        </h1>

                        <p className="mt-1 text-slate-400">
                            Manage all your products inventory
                        </p>
                    </div>

                    <Link
                        to="/products/add"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-medium text-white transition hover:bg-emerald-700"
                    >
                        <Plus size={18} />
                        Add Product
                    </Link>
                </div>

                {/* Search */}
                <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                    <div className="relative">
                        <Search
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                        />

                        <input
                            type="text"
                            placeholder="Search by product name, SKU, code, barcode, brand or category..."
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-12 pr-4 text-slate-300 outline-none transition placeholder:text-slate-500 focus:border-emerald-500"
                        />
                    </div>
                </div>

                {/* Result count */}
                <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        Showing{" "}
                        <span className="font-medium text-slate-300">
                            {filteredProducts.length}
                        </span>{" "}
                        of{" "}
                        <span className="font-medium text-slate-300">
                            {products.length}
                        </span>{" "}
                        products
                    </p>
                </div>

                {/* Table */}
                <ProductTable
                    products={filteredProducts}
                    onDelete={handleDelete}
                />
            </div>
        </div>
    );
}