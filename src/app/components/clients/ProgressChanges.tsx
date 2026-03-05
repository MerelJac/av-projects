"use client";
import { ProgressChangesProps } from "@/types/progress";
import { useState } from "react";
import ExerciseModal from "../exercise/ExerciseModal";

export function ProgressChanges({
  clientId,
  strength,
  weight,
  bodyFat,
}: ProgressChangesProps) {
  const [openExercise, setOpenExercise] = useState<{
    exerciseId: string;
    clientId?: string;
  } | null>(null);

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Strength Progress</h2>
      </div>

      <div className="progress-card">
        <p className="prog-sub-label">1RM Changes</p>

        {/* Strength rows */}
        {strength.length === 0 ? (
          <p className="text-sm text-muted">Not enough data yet</p>
        ) : (
          strength.map((lift) => {
            const diff = lift.current1RM - lift.previous1RM;
            const isPos = diff > 0;
            const isNeg = diff < 0;
            // bar width: scale diff to a max of 100%, cap at 10lb = 100%
            const barWidth = Math.min((Math.abs(diff) / 10) * 100, 100);

            return (
              <div
                key={lift.exerciseId}
                onClick={() =>
                  setOpenExercise({ exerciseId: lift.exerciseId, clientId })
                }
                className="prog-row"
              >
                {/* Name */}
                <span className="prog-name">{lift.exerciseName}</span>

                {/* Bar */}
                <div className="prog-bar-wrap">
                  <div
                    className={`prog-bar ${
                      isPos ? "pos" : isNeg ? "neg" : "net"
                    }`}
                    style={{ width: diff === 0 ? "0%" : `${barWidth}%` }}
                  />
                </div>

                {/* Delta */}
                <span
                  className={`prog-delta ${
                    isPos ? "pos" : isNeg ? "neg" : "net"
                  }`}
                >
                  {diff === 0 ? "No change" : `${isPos ? "+" : ""}${diff} lb`}
                </span>
              </div>
            );
          })
        )}

        {/* Body stats */}
        <div className="body-stats">
          <div className="body-stat">
            <p className="bs-label">Body Weight</p>
            {weight ? (
              <p className="bs-val">
                {weight.current} lb{" "}
                <span
                  className={
                    weight.current - weight.previous > 0 ? "neg" : "pos"
                  }
                >
                  ({weight.current - weight.previous > 0 ? "+" : ""}
                  {weight.current - weight.previous})
                </span>
              </p>
            ) : (
              <p className="bs-val">— lbs</p>
            )}
          </div>

          <div className="body-stat">
            <p className="bs-label">Body Fat %</p>
            {bodyFat ? (
     <p className="bs-val">
                {bodyFat.current}%{" "}
                <span
                  className={
                    bodyFat.current - bodyFat.previous > 0
                      ? "neg" : "pos"
                  }
                >
                  ({bodyFat.current - bodyFat.previous > 0 ? "+" : ""}
                  {bodyFat.current - bodyFat.previous}%)
                </span>
              </p>
            ) : (
              <p className="bs-val">— %</p>
            )}
          </div>
        </div>
      </div>
      {openExercise && (
        <ExerciseModal
          exerciseId={openExercise.exerciseId}
          clientId={openExercise.clientId}
          onClose={() => setOpenExercise(null)}
        />
      )}
    </div>
  );
}
