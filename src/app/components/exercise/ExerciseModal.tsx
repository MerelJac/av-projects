"use client";
import { useEffect, useState } from "react";
import { X, Dumbbell, TrendingUp } from "lucide-react";
import { ExerciseDetail, OneRMPoint } from "@/types/exercise";
import { getEmbedUrl } from "@/lib/video";
import { OneRMLineChart } from "../clients/OneRmLineChart";

export default function ExerciseModal({
  exerciseId,
  clientId,
  onClose,
}: {
  exerciseId: string;
  clientId?: string;
  onClose: () => void;
}) {
  const [exercise, setExercise] = useState<ExerciseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [oneRMHistory, setOneRMHistory] = useState<OneRMPoint[]>([]);

  useEffect(() => {
    if (!clientId) return;
    fetch(`/api/clients/${clientId}/exercises/${exerciseId}/one-rm`)
      .then((res) => res.json())
      .then(setOneRMHistory);
  }, [clientId, exerciseId]);

  useEffect(() => {
    let active = true;
    fetch(`/api/exercises/${exerciseId}`)
      .then((res) => res.json())
      .then((data) => {
        if (active) { setExercise(data); setLoading(false); }
      });
    return () => { active = false; };
  }, [exerciseId]);

  const embedUrl = exercise?.videoUrl ? getEmbedUrl(exercise.videoUrl) : null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-white/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pointer-events-none">
        <div className="bg-white border border-surface2 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto pointer-events-auto">

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center p-12">
              <div className="text-muted text-sm">Loading…</div>
            </div>
          )}

          {!loading && exercise && (
            <>
              {/* Header */}
              <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-surface2 sticky top-0 bg-white z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-secondary-color/10 flex items-center justify-center flex-shrink-0">
                    <Dumbbell size={15} className="text-secondary-color" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-syne font-bold text-base text-foreground ">
                      {exercise.name}
                    </h2>
                    <p className="text-[11px] text-muted mt-0.5">
                      {[exercise.type, exercise.equipment, exercise.muscleGroup]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-muted hover:text-foreground transition-colors flex-shrink-0 ml-3"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="p-5 space-y-5">

                {/* Video */}
                {embedUrl && (
                  <div className="rounded-xl overflow-hidden border border-surface2">
                    {embedUrl.endsWith(".mp4") ? (
                      <video controls className="w-full" src={embedUrl} />
                    ) : (
                      <div className="relative aspect-video">
                        <iframe
                          src={embedUrl}
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {exercise.notes && (
                  <div className="bg-white rounded-xl px-4 py-3.5">
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-muted mb-1.5">
                      Notes
                    </p>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {exercise.notes}
                    </p>
                  </div>
                )}

                {/* 1RM Progress */}
                {clientId && oneRMHistory.length > 0 && (
                  <div className="bg-white rounded-xl px-4 py-3.5">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp size={13} className="text-secondary-color" />
                      <p className="text-[10px] font-semibold tracking-widest uppercase text-muted">
                        1RM Progress
                      </p>
                    </div>
                    <OneRMLineChart data={oneRMHistory} />
                  </div>
                )}

                {/* Substitutions */}
                <div>
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-muted mb-3">
                    Substitutions
                  </p>
                  {exercise.substitutions.length === 0 ? (
                    <p className="text-sm text-muted italic">No substitutions available</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {exercise.substitutions.map((sub) => (
                        <li key={sub.id}
                          className="flex items-start gap-3 bg-white border border-surface2 rounded-xl px-4 py-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-secondary-color mt-2 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{sub.name}</p>
                            {sub.note && (
                              <p className="text-xs text-muted mt-0.5">{sub.note}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}