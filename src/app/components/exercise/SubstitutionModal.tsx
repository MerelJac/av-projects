"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Prescribed } from "@/types/prescribed";
import { X, ArrowLeftRight } from "lucide-react";

type Exercise = { id: string; name: string };

export default function SubstitutionModal({
  exerciseId,
  workoutLogId,
  sectionId,
  prescribed,
  onClose,
}: {
  exerciseId: string;
  workoutLogId: string;
  sectionId?: string;
  prescribed?: Prescribed | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [subs, setSubs] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/exercises/${exerciseId}/substitutions`)
      .then((res) => res.json())
      .then(setSubs);
  }, [exerciseId]);

  async function handleSubstitute(newExerciseId: string) {
    setLoading(true);
    setSelecting(newExerciseId);
    await fetch("/api/workouts/substitute", {
      method: "POST",
      body: JSON.stringify({ workoutLogId, sectionId, oldExerciseId: exerciseId, newExerciseId, prescribed }),
    });
    setLoading(false);
    onClose();
    router.refresh();
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-white/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Centered modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-5 pointer-events-none">
        <div className="bg-white border-dashed border-2 border-surface2 rounded-2xl w-full max-w-sm pointer-events-auto p-5 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Handle */}
          <div className="w-8 h-1 bg-white rounded-full mx-auto" />

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-lime-green/10 flex items-center justify-center">
                <ArrowLeftRight size={14} className="text-lime-green" />
              </div>
              <h2 className="font-syne font-bold text-base text-foreground">
                Substitute Exercise
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-muted hover:text-foreground transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* List */}
          {subs.length === 0 ? (
            <div className="bg-white rounded-2xl px-4 py-5 text-center space-y-1">
              <p className="text-sm font-medium text-foreground">No substitutions available</p>
              <p className="text-xs text-muted">
                Tap &apos;+ Add Exercise&apos; at the bottom of the section to add your own.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {subs.map((ex) => (
                <li key={ex.id}>
                  <button
                    onClick={() => handleSubstitute(ex.id)}
                    disabled={loading}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all active:scale-[0.98] disabled:opacity-50 ${
                      selecting === ex.id
                        ? "bg-lime-green/10 border-lime-green/30 text-lime-green"
                        : "bg-white border-surface2 text-foreground hover:border-lime-green/20"
                    }`}
                  >
                    <span className="text-sm font-medium">{ex.name}</span>
                    {selecting === ex.id
                      ? <span className="text-xs text-lime-green">Selecting…</span>
                      : <span className="text-muted text-sm">→</span>
                    }
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Cancel */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-white text-muted font-medium text-sm hover:text-foreground transition-colors"
          >
            Cancel
          </button>

        </div>
      </div>
    </>,
    document.body
  );
}