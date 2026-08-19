export default function NotesSection({
  notes,
  setNotes,
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-2xl font-bold">
        Notes
      </h2>

      <p className="mt-1 text-slate-400">
        Additional remarks for this purchase.
      </p>

      <textarea
        rows={6}
        value={notes}
        onChange={(e) =>
          setNotes(e.target.value)
        }
        placeholder="Enter notes..."
        className="mt-5 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-emerald-500"
      />
    </div>
  );
}