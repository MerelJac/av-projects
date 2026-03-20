"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, FileSpreadsheet } from "lucide-react";

export default function NewBOMPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${id}/boms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed to create BOM");
      const data = await res.json();
      router.push(`/projects/${id}/bom/${data.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }
  return (
    <div className="bg-[#F7F6F3]">
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[#666] hover:text-[#111] mb-8 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Project
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-[#111] rounded-xl flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#111] tracking-tight">
              New Bill of Materials
            </h1>
            <p className="text-sm text-[#888] mt-0.5">
              Define the items and quantities for this project
            </p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden"
        >
          <div className="p-8 space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#888] mb-2">
                BOM Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Conference Room A — AV Package"
                className="w-full px-4 py-3 border border-[#E5E3DE] rounded-xl text-[#111] text-sm placeholder:text-[#bbb] focus:outline-none focus:border-[#111] transition-colors"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#888] mb-2">
                Description{" "}
                <span className="text-[#bbb] font-normal normal-case tracking-normal">
                  optional
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Internal notes about scope, assumptions, or constraints..."
                rows={4}
                className="w-full px-4 py-3 border border-[#E5E3DE] rounded-xl text-[#111] text-sm placeholder:text-[#bbb] focus:outline-none focus:border-[#111] transition-colors resize-none"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-5 bg-[#F7F6F3] border-t border-[#E5E3DE] flex items-center justify-between">
            <p className="text-xs text-[#999]">
              You can add line items after creating the BOM
            </p>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="bg-[#111] text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-40 hover:bg-[#333] transition-colors"
            >
              {loading ? "Creating…" : "Create BOM →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
