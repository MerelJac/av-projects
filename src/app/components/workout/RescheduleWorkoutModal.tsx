"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { rescheduleWorkout } from "@/app/(team)/clients/[clientId]/actions";
import { normalizeDate, toInputDate } from "@/app/utils/format/formatDateFromInput";

export function RescheduleWorkoutModal({
  scheduledWorkoutId,
  currentDate,
  onClose,
}: {
  scheduledWorkoutId: string;
  currentDate: Date;
  onClose: () => void;
}) {
  const [date, setDate] = useState(() => toInputDate(currentDate));

  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setSaving(true);
    await rescheduleWorkout(scheduledWorkoutId, normalizeDate(date));
    router.refresh();
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/40">
      <div className=" rounded-xl shadow-lg w-full max-w-sm p-6 space-y-4 border-2 border-dashed bg-white">
        <h2 className="text-lg font-semibold">Reschedule workout</h2>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border rounded px-3 py-2 bg-muted"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-red-800 hover:text-red-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
