export default function FormField({
  label,
  required = false,
  children,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}
        {required && (
          <span className="text-red-400 ml-1">*</span>
        )}
      </label>

      {children}
    </div>
  );
}