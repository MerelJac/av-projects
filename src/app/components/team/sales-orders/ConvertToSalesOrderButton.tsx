"use client";
// src/app/components/ConvertToSalesOrderButton.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Loader2, ExternalLink } from "lucide-react";

export default function ConvertToSalesOrderButton({
  projectId,
  quoteId,
  existingSalesOrderId,
}: {
  projectId: string;
  quoteId: string;
  existingSalesOrderId?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already converted — just navigate
  if (existingSalesOrderId) {
    return (
      <button
        onClick={() =>
          router.push(`/projects/${projectId}/sales-orders/${existingSalesOrderId}`)
        }
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
      >
        <ExternalLink size={14} />
        View Sales Order
      </button>
    );
  }

  async function handleConvert() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/quotes/${quoteId}/convert`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Conversion failed");
        return;
      }
      router.push(`/projects/${projectId}/sales-orders/${data.salesOrderId}`);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleConvert}
        disabled={loading}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-[#111] border border-[#E5E3DE] hover:bg-[#F7F6F3] disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <ShoppingCart size={14} />
        )}
        {loading ? "Converting…" : "Convert to Sales Order"}
      </button>
      {error && (
        <p className="text-xs text-red-600 mt-1.5 px-1">{error}</p>
      )}
    </div>
  );
}
