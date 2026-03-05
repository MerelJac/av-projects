"use client";

import { useState } from "react";
import {  X } from "lucide-react";
import { createWorkoutForLater } from "@/app/(client)/workouts/actions";

export function CreateWorkoutForLater({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [addWorkoutName, setAddWorkoutName] = useState("");

  return (
    <>
      <div className="add-card">
        <div className="add-card-text">
          <div className="add-title">Create Strength Workout for Later</div>
          <div className="add-sub">Program now, train later.</div>
        </div>
        <div className="add-btn">
          <button onClick={() => setOpen(true)}>+</button>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/40">
          <div className="relative w-full max-w-md rounded-xl add-card p-6 shadow-lg max-h-[80vh] overflow-y-scroll flex flex-col">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded p-1 hover:bg-gray-100"
            >
              <X size={18} />
            </button>
            <div className="flex flex-col gap-2">
            <h3 className="mb-2 text-lg font-semibold text-secondary-color">
                Name your workout.
              </h3>

              <input
                className="w-full border rounded px-3 py-2"
                value={addWorkoutName}
                placeholder={"Workout name"}
                onChange={(e) => setAddWorkoutName(e.target.value)}
              />

              <button
                className="btn-primary"
                onClick={async () => {
                  await createWorkoutForLater(clientId, addWorkoutName);
                }}
              >
                Create Workout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
