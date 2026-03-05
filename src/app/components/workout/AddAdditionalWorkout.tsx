// src/app/components/workout/AddAdditionalWorkout.tsx
"use client";

import { createAdditionalStrengthWorkout } from "@/app/(client)/workouts/actions";
import { addAdditionalWorkout } from "@/app/actions/workout";
import { normalizeDate, toInputDate } from "@/app/utils/format/formatDateFromInput";
import { useEffect, useState, startTransition } from "react";

type AdditionalWorkoutType = {
  id: string;
  name: string;
};

export function AddAdditionalWorkout({
  clientId,
  onSaved,
}: {
  clientId: string;
  onSaved?: () => void;
}) {
  const [types, setTypes] = useState<AdditionalWorkoutType[]>([]);
  const [typeId, setTypeId] = useState("");
  const [duration, setDuration] = useState<number | "">("");
  const [distance, setDistance] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date());
  const [addWorkoutName, setAddWorkoutName] = useState("");

  const [saving, setSaving] = useState(false);

  // Load activity types
  useEffect(() => {
    async function loadTypes() {
      const res = await fetch("/api/workouts/additional");

      if (!res.ok) {
        console.error("Failed to load additional workout types");
        return;
      }

      const data = await res.json();
      setTypes(data);
    }

    loadTypes();
  }, []);

  function handleSave() {
    if (!typeId) return;

    setSaving(true);

    startTransition(async () => {
      await addAdditionalWorkout(clientId, {
        typeId,
        duration: duration === "" ? undefined : Number(duration),
        distance: distance === "" ? undefined : Number(distance),
        notes: notes || undefined,
        performedAt: new Date(date),
      });

      setSaving(false);
      setTypeId("");
      setDuration("");
      setDistance("");
      setNotes("");
      onSaved?.();
    });
  }

  return (
    <div className="space-y-4">
      {/* Activity type */}
      <div>
        <label className="add-sub pb-2">
          Activity
        </label>
        <select
          value={typeId}
          onChange={(e) => setTypeId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Select activity</option>
          {types.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>
      {/* SHOW for strength training additional workout */}
      {/* 5b4f1be3-ed4f-4704-ad79-7b7cb95bd25d */}
      {typeId == "5b4f1be3-ed4f-4704-ad79-7b7cb95bd25d" && (
        <div className="space-y-4">
          <p className="text-center font-bold uppercase">Log your weights & reps</p>
          <input
            className="w-full border rounded px-3 py-2"
            value={addWorkoutName}
            placeholder={"Workout name"}
            onChange={(e) => setAddWorkoutName(e.target.value)}
          />

          <button
            className="w-full bg-blue-600 text-white rounded px-4 py-2"
            onClick={async () => {
              await createAdditionalStrengthWorkout(clientId, addWorkoutName);
            }}
          >
            Log Workout
          </button>
          <p className="text-center font-bold">OR QUICK ADD</p>
        </div>
      ) } {typeId ? (
        // 🟢 CARDIO / OTHER ACTIVITIES
        <div className="space-y-4">
          {/* Duration */}
          <div>
            <label className="add-sub">
              Duration (minutes)
            </label>
            <input
              type="number"
              min={0}
              value={duration}
              onChange={(e) =>
                setDuration(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          {/* Distance */}
          <div>
            <label className="add-sub">
              Distance (optional)
            </label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={distance}
              onChange={(e) =>
                setDistance(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          {/* Date */}
          <div>
            <label className="add-sub">
              Date
            </label>
            <input
              type="date"
              value={toInputDate(date)}
              onChange={(e) => setDate(normalizeDate(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="add-sub">
              Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          {/* Save */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={!typeId || saving}
              className="btn-primary"
            >
              {saving ? "Saving…" : "Add Workout"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
