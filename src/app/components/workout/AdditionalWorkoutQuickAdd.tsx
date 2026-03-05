"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { AddAdditionalWorkout } from "./AddAdditionalWorkout";

export function AdditionalWorkoutQuickAdd({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="add-card">
        <div className="add-card-text">
          <div className="add-title">Add Activity</div>
          <div className="add-sub">Log extra training or cardio</div>
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

            <h3 className="mb-2 text-lg font-semibold text-lime-green">
              Log additional workout
            </h3>

            <AddAdditionalWorkout
              clientId={clientId}
              onSaved={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
