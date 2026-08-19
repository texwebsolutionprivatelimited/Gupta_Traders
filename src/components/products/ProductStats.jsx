export default function ProductStats({ products }) {
    const totalProducts = products.length;

    const inStock = products.filter(
        (product) =>
            Number(product.stock) > 0 &&
            Number(product.stock) >
                Number(product.minStock || 10)
    ).length;

    const lowStock = products.filter(
        (product) =>
            Number(product.stock) > 0 &&
            Number(product.stock) <=
                Number(product.minStock || 10)
    ).length;

    const outOfStock = products.filter(
        (product) => Number(product.stock) === 0
    ).length;

    const stats = [
        {
            title: "Total Products",
            value: totalProducts,
            className:
                "border-slate-800 bg-slate-900/60",
            textClass: "text-slate-400",
        },
        {
            title: "In Stock",
            value: inStock,
            className:
                "border-emerald-500/20 bg-emerald-500/10",
            textClass: "text-emerald-400",
        },
        {
            title: "Low Stock",
            value: lowStock,
            className:
                "border-amber-500/20 bg-amber-500/10",
            textClass: "text-amber-400",
        },
        {
            title: "Out Of Stock",
            value: outOfStock,
            className:
                "border-red-500/20 bg-red-500/10",
            textClass: "text-red-400",
        },
    ];

    return (
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
                <div
                    key={stat.title}
                    className={`rounded-2xl border p-5 ${stat.className}`}
                >
                    <p
                        className={`text-sm ${stat.textClass}`}
                    >
                        {stat.title}
                    </p>

                    <h3 className="mt-2 text-3xl font-bold text-white">
                        {stat.value}
                    </h3>
                </div>
            ))}
        </div>
    );
}