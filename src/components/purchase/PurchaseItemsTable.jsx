export default function PurchaseItemsTable({
  items,
  products,
  addItem,
  removeItem,
  updateItem,
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-800 p-6">
        <div>
          <h2 className="text-2xl font-bold">
            Purchase Items
          </h2>

          <p className="text-slate-400">
            Add products included in this purchase.
          </p>
        </div>

        <button
          type="button"
          onClick={addItem}
          className="rounded-xl bg-emerald-500 px-5 py-3 font-medium text-white hover:bg-emerald-600"
        >
          + Add Product
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="p-4 text-left">
                Product
              </th>
              <th className="p-4 text-left">
                Quantity
              </th>
              <th className="p-4 text-left">
                Purchase Price
              </th>
              <th className="p-4 text-left">
                GST %
              </th>
              <th className="p-4 text-left">
                Amount
              </th>
              <th className="p-4 text-left">
                GST Amount
              </th>
              <th className="p-4 text-left">
                Total
              </th>
              <th className="p-4 text-left">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-t border-slate-800"
              >
                <td className="p-4">
                  <select
                    value={item.product}
                    onChange={(e) =>
                      updateItem(
                        item.id,
                        "product",
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3"
                  >
                    <option value="">
                      Select Product
                    </option>

                    {products.map((product) => (
                      <option
                        key={product}
                        value={product}
                      >
                        {product}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="p-4">
                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) =>
                      updateItem(
                        item.id,
                        "qty",
                        Number(e.target.value)
                      )
                    }
                    className="w-28 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3"
                  />
                </td>

                <td className="p-4">
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) =>
                      updateItem(
                        item.id,
                        "price",
                        Number(e.target.value)
                      )
                    }
                    className="w-32 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3"
                  />
                </td>

                <td className="p-4">
                  <select
                    value={item.gst}
                    onChange={(e) =>
                      updateItem(
                        item.id,
                        "gst",
                        Number(e.target.value)
                      )
                    }
                    className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3"
                  >
                    <option value="0">
                      0%
                    </option>
                    <option value="5">
                      5%
                    </option>
                    <option value="12">
                      12%
                    </option>
                    <option value="18">
                      18%
                    </option>
                    <option value="28">
                      28%
                    </option>
                  </select>
                </td>

                <td className="p-4 font-semibold">
                  ₹{item.amount.toFixed(2)}
                </td>

                <td className="p-4 font-semibold">
                  ₹{item.gstAmount.toFixed(2)}
                </td>

                <td className="p-4 font-bold text-emerald-400">
                  ₹{item.total.toFixed(2)}
                </td>

                <td className="p-4">
                  <button
                    type="button"
                    onClick={() =>
                      removeItem(item.id)
                    }
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}