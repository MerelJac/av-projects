"use client";

import { Trash } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteQuoteButton({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDeleteQuote() {
    if (!confirm("Are you sure you want to delete this proposal? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete proposal");
      }

      router.push("/quotes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setDeleting(false);
    }
  }

  return (
    <div className="border border-danger/20 bg-danger/5 rounded-2xl p-5 space-y-3">
      <h2 className="text-[10px] font-semibold tracking-widest uppercase text-danger">
        Danger Zone
      </h2>
      <p className="text-sm text-muted pt-2">
        Deleting a proposal will permanently remove all associated data, including quotes, boms, and more.
      </p>
      <button
        onClick={handleDeleteQuote}
        disabled={deleting}
        className="inline-flex items-center gap-2 rounded-xl bg-danger/10 border border-danger/20 px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger/20 transition active:scale-[0.98] disabled:opacity-50"
      >
        <Trash size={14} />
        {deleting ? "Deleting…" : "Delete proposal"}
      </button>
      {error && <p className="text-danger text-sm">{error}</p>}
    </div>
  );
}
