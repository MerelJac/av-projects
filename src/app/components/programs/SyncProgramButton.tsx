// src/app/components/clients/SyncProgramButton.tsx
"use client";

import { useState } from "react";
import { appendProgramWorkoutsToClient } from "@/app/(team)/programs/[programId]/actions";
import { RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";

export function SyncProgramButton({
  clientId,
  programId,
}: {
  clientId: string;
  programId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState<number | null>(null);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setAdded(null);

    const result = await appendProgramWorkoutsToClient(programId, clientId);

    if (result.ok) {
      setAdded(result.added);
      router.refresh(); // pull in new scheduled workouts
    }

    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3 justify-end">
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-surface2 hover:border-secondary-color/30 hover:text-secondary-color text-muted text-sm font-medium transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
                                      title="Update with new workouts in the program."
      >
        <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
        {loading ? "Syncing…" : "Add new workouts"}
        
      </button>

      {added !== null && (
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            added === 0
              ? "text-muted bg-white"
              : "text-[#3dffa0] bg-[#3dffa0]/10"
          }`}
        >
          {added === 0
            ? "Nothing new"
            : `+${added} workout${added > 1 ? "s" : ""}`}
        </span>
      )}
    </div>
  );
}
