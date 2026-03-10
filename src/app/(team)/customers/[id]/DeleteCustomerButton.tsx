"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertCircle } from "lucide-react";

export default function DeleteCustomerButton({
  customerId,
  customerName,
  projectCount,
  quoteCount,
}: {
  customerId: string;
  customerName: string;
  projectCount: number;
  quoteCount: number;
}) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasData = projectCount > 0 || quoteCount > 0;

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to delete");
      }
      router.push("/customers");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete");
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#E5E3DE] bg-white hover:bg-red-50 hover:border-red-200 text-[#ccc] hover:text-red-500 transition-colors"
        title="Delete customer"
      >
        <Trash2 size={15} />
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => !deleting && setShowConfirm(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-[#E5E3DE] p-6 max-w-sm w-full mx-4">

            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-4">
              <Trash2 size={18} className="text-red-500" />
            </div>

            <h2 className="text-base font-bold text-[#111] mb-1">
              Delete Customer?
            </h2>
            <p className="text-sm text-[#666] mb-3">
              <span className="font-semibold text-[#111]">{customerName}</span> will be permanently deleted. This cannot be undone.
            </p>

            {hasData && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 space-y-1">
                <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
                  <AlertCircle size={14} />
                  This customer has associated data
                </div>
                <ul className="text-xs text-amber-600 space-y-0.5 ml-5 list-disc">
                  {projectCount > 0 && (
                    <li>{projectCount} project{projectCount !== 1 ? "s" : ""}</li>
                  )}
                  {quoteCount > 0 && (
                    <li>{quoteCount} quote{quoteCount !== 1 ? "s" : ""}</li>
                  )}
                </ul>
                <p className="text-xs text-amber-600 mt-1">
                  Deleting this customer will also remove all associated records.
                </p>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 mb-4">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                className="flex-1 text-sm font-semibold px-4 py-2.5 rounded-xl border border-[#E5E3DE] hover:bg-[#F7F6F3] disabled:opacity-40 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 text-sm font-semibold px-4 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {deleting ? "Deleting…" : "Delete Customer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}