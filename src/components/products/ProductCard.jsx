export default function ProductCard({
    title,
    value,
    icon = null,
}) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-5 transition hover:border-slate-700 hover:bg-slate-800/60">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm text-slate-400">
                        {title}
                    </p>

                    <h3 className="mt-2 break-words text-lg font-semibold text-white">
                        {value || "-"}
                    </h3>
                </div>

                {icon && (
                    <div className="rounded-lg bg-slate-700/60 p-2 text-slate-400">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}