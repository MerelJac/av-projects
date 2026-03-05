"use client";

import { useRef, useState } from "react";
import { Performed, Prescribed } from "@/types/prescribed";
import {
  alertTrainerOfCompletedWorkout,
  logExercise,
  startWorkout,
  stopWorkout,
  rerunWorkout,
  saveWorkoutForLater,
  alertTrainerOfCreateForLaterWorkout,
  startBuildingWorkout,
} from "@/app/(client)/workouts/[scheduledWorkoutId]/actions";
import { ExerciseLogger } from "./ExerciseLogger";
import { ExerciseLog, ScheduledWorkoutWithLogs } from "@/types/workout";
import { ExerciseLogViewer } from "./ExerciseLogViewer";
import { useRouter } from "next/navigation";
import { assertPrescribed } from "@/app/utils/prescriptions/assertPrescribed";
import { AddExerciseToWorkout } from "./AddExerciseToWorkout";
import { RotateCcw } from "lucide-react";

export default function WorkoutRunner({
  scheduledWorkout,
}: {
  scheduledWorkout: ScheduledWorkoutWithLogs;
}) {
  const activeLog = scheduledWorkout.workoutLogs[0] ?? null;
  const isActive =
    ["IN_PROGRESS", "BUILDING"].includes(activeLog?.status ?? "") &&
    !activeLog?.endedAt;
  const router = useRouter();
  const clientId = scheduledWorkout.clientId;
  const isCompleted = activeLog?.status === "COMPLETED";
  const programId = scheduledWorkout.workout.program?.id ?? null;
  console.log("Program Id: ", programId);
  const [workoutLogId, setWorkoutLogId] = useState<string | null>(
    activeLog?.id ?? null,
  );
  const [finishingText, setFinishingText] = useState("Finish Workout");
  const [isFinishing, setIsFinishing] = useState(false);
  const [isCreatingForLater, setIsCreatingForLater] = useState(false);
  const [createForLaterText, setCreateForLaterText] = useState(
    "Save Workout for Later",
  );
  const handleRerunWorkout = async () => {
    if (!confirm("Restart this workout?")) return;

    await rerunWorkout(scheduledWorkout.id);
  };

  const [exerciseStates, setExerciseStates] = useState<
    {
      exerciseId: string;
      prescribed: Prescribed;
      performed: Performed;
      note: string;
      sectionId?: string | null;
    }[]
  >([]);

  const autoSaveFns = useRef<(() => Promise<void>)[]>([]);

  const logs: ExerciseLog[] = activeLog
    ? activeLog.exercises.map((log) => ({
        id: log.id,
        workoutLogId: activeLog.id,
        exerciseId: log.exerciseId,
        exerciseName: log.exercise.name,
        prescribed: assertPrescribed(log.prescribed),
        performed: log.performed as Performed,
        substitutedFrom: log.substitutedFrom ?? null,
        substitutionReason: log.substitutionReason ?? null,
      }))
    : [];

  console.log("schedueld logs:", scheduledWorkout);
  console.log("active logs", activeLog);
  if (isCompleted) {
    console.log("Completed workout logs:", logs);
    return (
      <>
        <div className="flex flex-row justify-between items-center gap-2">
          <div className="greeting">
            <h1>Workout completed!</h1>
          </div>

          {/* {programId ? (
            <button onClick={handleRerunWorkout}>
              <RotateCcw size={14} />
            </button>
          ) : (
            <p className="text-xs text-gray-500 pb-4 max-w-[140px] break-words">
              You created this workout!
            </p>
          )} */}

          <button onClick={handleRerunWorkout}>
            <RotateCcw size={14} />
          </button>
        </div>

        <ExerciseLogViewer logs={logs} />
      </>
    );
  }

  return (
    <div className="greeting h-full">
      <h1 className="pb-2">{scheduledWorkout.workout.name}</h1>

      {/* START / STOP */}
      {!isActive ? (
        <>
          {scheduledWorkout.workout.program?.id?.startsWith("__") &&
          scheduledWorkout.status == "READY_TO_BUILD" ? (
            <button
              className="btn-primary mb-4"
              onClick={async () => {
                const id = await startBuildingWorkout(scheduledWorkout.id);
                autoSaveFns.current = [];
                setWorkoutLogId(id);
                router.refresh();
              }}
            >
              Start Building Workout for Later
            </button>
          ) : (
            <button
              className="btn-primary mb-4"
              onClick={async () => {
                const id = await startWorkout(scheduledWorkout.id);
                autoSaveFns.current = []; // 🧼 CLEAR OLD REGISTRATIONS
                setWorkoutLogId(id);
                router.refresh();
              }}
            >
              Start workout
            </button>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-2">
          {scheduledWorkout.workout.program?.id?.startsWith("__") &&
          scheduledWorkout.status == "BUILDING" ? (
            // CREATE FOR LATER
            <button
              className="btn-primary mb-4"
              disabled={isCreatingForLater}
              onClick={async () => {
                if (!workoutLogId || isCreatingForLater) return;

                setIsCreatingForLater(true);
                setCreateForLaterText("Saving...");

                // 🔐 Auto-save all unsaved exercises
                for (const ex of exerciseStates) {
                  await logExercise(
                    workoutLogId,
                    ex.exerciseId,
                    ex.prescribed,
                    ex.performed,
                    ex.note,
                    ex.sectionId ?? null,
                  );
                }

                await saveWorkoutForLater(workoutLogId);
                await alertTrainerOfCreateForLaterWorkout(
                  clientId,
                  workoutLogId,
                );
                setWorkoutLogId(null);
                router.refresh();
              }}
            >
              {createForLaterText}
            </button>
          ) : (
            <button
              className="btn-finish"
              disabled={isFinishing}
              onClick={async () => {
                if (!workoutLogId || isFinishing) return;

                setIsFinishing(true);
                setFinishingText("Finishing...");

                // 🔐 Auto-save all unsaved exercises
                for (const ex of exerciseStates) {
                  await logExercise(
                    workoutLogId,
                    ex.exerciseId,
                    ex.prescribed,
                    ex.performed,
                    ex.note,
                    ex.sectionId ?? null,
                  );
                }

                await stopWorkout(workoutLogId);
                await alertTrainerOfCompletedWorkout(clientId, workoutLogId);
                setWorkoutLogId(null);
                router.refresh();
              }}
            >
              {finishingText}
            </button>
          )}
        </div>
      )}

      {!programId && (
        <p className="section-label pb-4">
          You are creating this workout. Log your exercises or add new ones if
          you don’t see what you need.
        </p>
      )}
      {/* EXERCISES */}
      <div className="space-y-6">
        {scheduledWorkout.workout.workoutSections.map((section) => (
          <div key={section.id} className="space-y-3">
            {/* SECTION HEADER */}
            <div className="section-label">
              <span>{section.title}</span>
            </div>

            <ul className="space-y-3">
              {section.exercises
                .filter(
                  (we) =>
                    !activeLog?.exercises.some(
                      (el) =>
                        el.exerciseId === we.exerciseId &&
                        el.sectionId === section.id,
                    ),
                )
                .map((we) => {
                  if (!we.exercise) return null;

                  return (
                    <ExerciseLogger
                      key={we.id}
                      exercise={we.exercise}
                      prescribed={assertPrescribed(we.prescribed)}
                      workoutLogId={workoutLogId}
                      clientId={clientId}
                      sectionId={section.id}
                      disabled={!isActive}
                      notes={we.notes}
                      status={activeLog?.status}
                      onChange={(data) => {
                        setExerciseStates((prev) => {
                          const existing = prev.find(
                            (e) =>
                              e.exerciseId === data.exerciseId &&
                              e.sectionId === data.sectionId,
                          );

                          if (existing) {
                            return prev.map((e) =>
                              e.exerciseId === data.exerciseId &&
                              e.sectionId === data.sectionId
                                ? data
                                : e,
                            );
                          }

                          return [...prev, data];
                        });
                      }}
                    />
                  );
                })}
              {/* CLIENT-ADDED EXERCISES */}
              {activeLog?.exercises
                .filter((el) => el.sectionId === section.id)
                .map((el) => (
                  <ExerciseLogger
                    key={el.id}
                    exercise={el.exercise}
                    prescribed={assertPrescribed(el.prescribed)}
                    performed={el.performed as Performed}
                    workoutLogId={workoutLogId}
                    clientId={clientId}
                    disabled={!isActive}
                    sectionId={section.id}
                    notes={el.substitutionReason}
                    status={activeLog?.status}
                    isClientAdded // 👈 ADD THIS FLAG
                    exerciseLogId={el.id} // 👈 PASS LOG ID
                    onChange={(data) => {
                      setExerciseStates((prev) => {
                        const existing = prev.find(
                          (e) =>
                            e.exerciseId === data.exerciseId &&
                            e.sectionId === data.sectionId,
                        );

                        if (existing) {
                          return prev.map((e) =>
                            e.exerciseId === data.exerciseId &&
                            e.sectionId === data.sectionId
                              ? data
                              : e,
                          );
                        }

                        return [...prev, data];
                      });
                    }}
                  />
                ))}
            </ul>
            {workoutLogId && isActive && (
              <AddExerciseToWorkout
                workoutLogId={workoutLogId}
                sectionId={section.id}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
