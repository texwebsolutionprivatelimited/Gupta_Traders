import FormField from "./FormField";

export default function PurchaseInfo({
  purchaseData,
  suppliers,
  handleChange,
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-2xl font-bold text-white">
        Purchase Information
      </h2>

      <p className="mt-1 text-slate-400">
        Enter supplier and invoice details.
      </p>

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <FormField
          label="Supplier"
          required
        >
          <select
            name="supplier"
            value={purchaseData.supplier}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
          >
            <option value="">
              Select Supplier
            </option>

            {suppliers.map((supplier) => (
              <option
                key={supplier}
                value={supplier}
              >
                {supplier}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Invoice Number">
          <input
            type="text"
            name="invoiceNo"
            value={purchaseData.invoiceNo}
            onChange={handleChange}
            placeholder="INV-001"
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
          />
        </FormField>

        <FormField
          label="Invoice Date"
          required
        >
          <input
            type="date"
            name="invoiceDate"
            value={purchaseData.invoiceDate}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
          />
        </FormField>

        <FormField label="Payment Mode">
          <select
            name="paymentMode"
            value={purchaseData.paymentMode}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
          >
            <option>Cash</option>
            <option>UPI</option>
            <option>Bank Transfer</option>
            <option>Cheque</option>
          </select>
        </FormField>
      </div>
    </div>
  );
}