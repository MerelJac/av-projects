"use client";
// app/components/vendors/AddVendorButton.tsx
import { useState } from "react";
import { Plus } from "lucide-react";
import { createVendor } from "./actions";
import { useRouter } from "next/navigation";

export function AddVendorButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = await createVendor({
      name: fd.get("name") as string,
      email: (fd.get("email") as string) || null,
      phone: (fd.get("phone") as string) || null,
      notes: (fd.get("notes") as string) || null,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#111] text-white text-xs font-semibold hover:bg-[#333] transition"
      >
        <Plus size={13} />
        Add Vendor
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-base font-bold text-[#111] mb-4">New Vendor</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#999] uppercase tracking-widest block mb-1">
                  Name *
                </label>
                <input
                  name="name"
                  required
                  className="w-full border border-[#E5E3DE] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#111]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#999] uppercase tracking-widest block mb-1">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  className="w-full border border-[#E5E3DE] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#111]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#999] uppercase tracking-widest block mb-1">
                  Phone
                </label>
                <input
                  name="phone"
                  className="w-full border border-[#E5E3DE] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#111]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#999] uppercase tracking-widest block mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full border border-[#E5E3DE] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#111] resize-none"
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm text-[#666] hover:text-[#111] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#111] text-white text-sm rounded-xl hover:bg-[#333] disabled:opacity-50 transition"
                >
                  {loading ? "Saving…" : "Create Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}