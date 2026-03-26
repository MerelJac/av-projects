"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Project = { id: string; name: string };

export default function DuplicateBomToProjectButton({
  bomId,
  bomName,
  projects,
}: {
  bomId: string;
  bomName: string;
  projects: Project[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDuplicate() {
    if (!targetProjectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/boms/${bomId}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetProjectId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to duplicate BOM");
        return;
      }
      const { bomId: newBomId, projectId } = await res.json();
      setOpen(false);
      router.push(`/projects/${projectId}/bom/${newBomId}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 bg-[#1a1a1a] text-white text-sm px-4 py-2 rounded-lg shadow-lg hover:bg-[#333] transition-colors"
      >
        Duplicate to Project
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-base font-semibold mb-1">Duplicate BOM to another project.</h2>
            <p className="text-sm text-[#666] mb-4">
              Copy <span className="font-medium">{bomName}</span> to another project.
            </p>

            <label className="block text-xs font-medium text-[#444] mb-1">
              Target project
            </label>
            <select
              value={targetProjectId}
              onChange={(e) => setTargetProjectId(e.target.value)}
              className="w-full border border-[#ddd] rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">Select a project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setOpen(false); setError(null); }}
                className="text-sm px-4 py-2 rounded-md border border-[#ddd] hover:bg-[#f5f5f5]"
              >
                Cancel
              </button>
              <button
                onClick={handleDuplicate}
                disabled={!targetProjectId || loading}
                className="text-sm px-4 py-2 rounded-md bg-[#1a1a1a] text-white hover:bg-[#333] disabled:opacity-40"
              >
                {loading ? "Duplicating…" : "Duplicate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
