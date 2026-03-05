"use client";

type Line = {
  id: string;
  description: string;
  quantity: number;
  price: number;
};

export default function QuoteLinesTable({
  lines,
}: {
  lines: Line[];
}) {
  return (
    <table className="w-full bg-white border rounded-xl">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-3 text-left">Item</th>
          <th className="p-3 text-left">Qty</th>
          <th className="p-3 text-left">Price</th>
          <th className="p-3 text-left">Total</th>
        </tr>
      </thead>

      <tbody>
        {lines.map((line) => (
          <tr key={line.id} className="border-t">
            <td className="p-3">{line.description}</td>

            <td className="p-3">{line.quantity}</td>

            <td className="p-3">${line.price}</td>

            <td className="p-3">
              ${(line.price * line.quantity).toFixed(2)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}