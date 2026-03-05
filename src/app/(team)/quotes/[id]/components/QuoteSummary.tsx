export default function QuoteSummary({
  lines,
}: {
  lines: any[];
}) {
  const total = lines.reduce(
    (sum, l) => sum + l.price * l.quantity,
    0
  );

  const cost = lines.reduce(
    (sum, l) => sum + (l.cost ?? 0) * l.quantity,
    0
  );

  const profit = total - cost;

  return (
    <div className="bg-white border rounded-xl p-6">

      <h3 className="font-semibold mb-4">
        Quote Summary
      </h3>

      <div className="flex justify-between py-1">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>

      <div className="flex justify-between py-1">
        <span>Cost</span>
        <span>${cost.toFixed(2)}</span>
      </div>

      <div className="flex justify-between py-1 font-semibold">
        <span>Profit</span>
        <span>${profit.toFixed(2)}</span>
      </div>

    </div>
  );
}