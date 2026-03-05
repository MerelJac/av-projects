"use client";

import { useOptimistic, startTransition, useState } from "react";
import {
  assignProgramToClient,
  createWorkout,
  deleteWorkout,
  duplicateWorkout,
} from "../(team)/programs/[programId]/actions";
import WorkoutCard from "./WorkoutCard";
import { ProgramWithWorkouts, WorkoutWithSections } from "@/types/workout";
import { Exercise } from "@/types/exercise";
import {
  updateProgramName,
  updateProgramNote,
} from "../(team)/programs/actions";
import { User, WorkoutDay } from "@prisma/client";
import { BackButton } from "./BackButton";
import { ClientProgramProgress } from "./ClientProgramProgress";
import { ClientWithWorkouts } from "@/types/client";
import { Plus, Users } from "lucide-react";
import { ExerciseQuickAdd } from "../(team)/exercises/components/ExerciseQuickAdd";
import { SyncProgramButton } from "./programs/SyncProgramButton";

export default function ProgramBuilder({
  program,
  exercises,
  clients,
  clientsAssignedProgram,
}: {
  program: ProgramWithWorkouts;
  exercises: Exercise[];
  clients: User[];
  clientsAssignedProgram: ClientWithWorkouts[];
}) {
  const [error, setError] = useState<string | null | undefined>(null);

  type WorkoutAction =
    | { type: "add"; workout: WorkoutWithSections }
    | { type: "remove"; id: string };

  const [optimisticWorkouts, updateOptimisticWorkouts] = useOptimistic<
    WorkoutWithSections[],
    WorkoutAction
  >(program.workouts, (state, action) => {
    switch (action.type) {
      case "add":
        return [...state, action.workout];
      case "remove":
        return state.filter((w) => w.id !== action.id);
      default:
        return state;
    }
  });

  const [editingName, setEditingName] = useState(false);
  const [editingNote, setEditingNote] = useState(false);

  const [programName, setProgramName] = useState(program.name);
  const [programNote, setProgramNote] = useState(program.notes ?? "");
  const [clientId, setClientId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [exerciseList, setExerciseList] = useState<Exercise[]>(exercises);
  async function saveProgramName() {
    setEditingName(false);
    startTransition(() => {
      updateProgramName(program.id, programName);
    });
  }

  async function saveProgramNote() {
    setEditingNote(false);

    const result = await updateProgramNote(program.id, programNote);

    if (!result.ok) {
      setError(result.error);
      return;
    }
  }

  async function handleAssign() {
    if (!clientId || !startDate) return;
    await assignProgramToClient(program.id, clientId, new Date(startDate));
    // Optional: reset form after success
    setClientId("");
    setStartDate("");
  }

  async function handleAddWorkout() {
    const optimisticWorkout: WorkoutWithSections = {
      id: crypto.randomUUID(),
      name: "New Workout",
      order: optimisticWorkouts.length,
      day: WorkoutDay.MONDAY,
      workoutSections: [
        {
          id: crypto.randomUUID(),
          title: "Main",
          order: 0,
          exercises: [],
        },
      ],
    };

    startTransition(() => {
      updateOptimisticWorkouts({
        type: "add",
        workout: optimisticWorkout,
      });
    });

    setError(null);
    const result = await createWorkout(program.id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
  }

  async function handleDeleteWorkout(workout: WorkoutWithSections) {
    startTransition(() => {
      updateOptimisticWorkouts({
        type: "remove",
        id: workout.id,
      });
    });
    setError(null);
    const result = await deleteWorkout(program.id, workout.id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
  }

  async function handleDuplicateWorkout(workout: WorkoutWithSections) {
    const optimisticCopy: WorkoutWithSections = {
      ...workout,
      id: crypto.randomUUID(),
      name: `${workout.name} (Copy)`,
      workoutSections: workout.workoutSections.map((section, sectionIndex) => ({
        ...section,
        id: crypto.randomUUID(),
        order: sectionIndex,
        exercises: section.exercises.map((we, exerciseIndex) => ({
          ...we,
          id: crypto.randomUUID(),
          order: exerciseIndex,
        })),
      })),
    };

    startTransition(() => {
      updateOptimisticWorkouts({
        type: "add",
        workout: optimisticCopy,
      });
    });
    setError(null);
    const result = await duplicateWorkout(program.id, workout.id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Program Name */}
      <BackButton route="/programs" />
      <div className="program-header">
        <div>
          <div className="flex items-start justify-between gap-6 flex-wrap flex-col">
            <div className="flex-1 min-w-[300px]">
              {editingName ? (
                <input
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  onBlur={saveProgramName}
                  onKeyDown={(e) => e.key === "Enter" && saveProgramName()}
                  className="w-full px-4 py-2.5 text-2xl font-bold border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-base"
                  autoFocus
                />
              ) : (
                <h1
                  className="program-name"
                  onClick={() => setEditingName(true)}
                >
                  {programName}
                  <span className="opacity-0 group-hover:opacity-70 text-gray-400">
                    ✎
                  </span>
                </h1>
              )}
            </div>
            <div className="flex-1 min-w-[300px]">
              {editingNote ? (
                <input
                  value={programNote}
                  onChange={(e) => setProgramNote(e.target.value)}
                  onBlur={saveProgramNote}
                  onKeyDown={(e) => e.key === "Enter" && saveProgramNote()}
                  className="program-desc"
                  autoFocus
                />
              ) : (
                <p
                  className="text-xs text-gray-900 cursor-pointer hover:text-foreground-700 transition-colors flex items-center gap-3 group"
                  onClick={() => setEditingNote(true)}
                >
                  {programNote || "Add program notes"}
                  <span className="opacity-0 group-hover:opacity-70 text-gray-400">
                    {" "}
                    ✎
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Assignment Area */}
        <div>
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
            <div className="field-group">
              <label className="field-label">Assign to Client</label>
              <div className="relative">
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="field-input"
                >
                  <option value="">Select a client…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.email}
                    </option>
                  ))}
                </select>
                <Users
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Start Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="field-input"
                />
              </div>
            </div>

            <button
              onClick={handleAssign}
              disabled={!clientId || !startDate}
              className="btn-assign"
            >
              Assign Program
            </button>
          </div>
        </div>

        {/* Assigned Clients Progress */}
        {clientsAssignedProgram.length > 0 && (
          <div className="assigned-section">
            <h3 className="assigned-label">Assigned Clients</h3>
            <div className="note-bar">
              <strong>Note:</strong> Changes to exercises, sets, reps, and notes
              update automatically for assigned clients. Adding new workouts
              requires a manual sync from here or the client&apos;s page.
            </div>
            <div className="space-y-4">
              {clientsAssignedProgram.map((client) => (
                <div key={client.id}>
                  <ClientProgramProgress key={client.id} client={client} />
                  <SyncProgramButton
                    clientId={client.id}
                    programId={program.id}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Workouts Section */}
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-col md:flex-row">
          <h2 className="workouts-title">Workouts</h2>
          <div className=" flex flex-row gap-2">
            <ExerciseQuickAdd
              onCreated={(exercise) => {
                setExerciseList((prev) => {
                  // prevent duplicates just in case
                  if (prev.some((e) => e.id === exercise.id)) return prev;
                  return [...prev, exercise];
                });
              }}
            />
            <button onClick={handleAddWorkout} className="btn-secondary">
              <Plus size={18} />
              Add Workout
            </button>
          </div>
        </div>

        {optimisticWorkouts.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-10 text-center">
            <p className="text-gray-600 mb-4">
              No workouts in this program yet
            </p>
            <button onClick={handleAddWorkout} className="btn-secondary">
              <Plus size={18} />
              Create your first workout
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {optimisticWorkouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                exercises={exerciseList}
                programId={program.id}
                onDelete={() => handleDeleteWorkout(workout)}
                onDuplicate={() => handleDuplicateWorkout(workout)}
              />
            ))}
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex items-center justify-end flex-col md:flex-row">
        <div className=" flex flex-row  justify-end gap-2">
          <ExerciseQuickAdd
            onCreated={(exercise) => {
              setExerciseList((prev) => {
                // prevent duplicates just in case
                if (prev.some((e) => e.id === exercise.id)) return prev;
                return [...prev, exercise];
              });
            }}
          />
          <button onClick={handleAddWorkout} className="btn-secondary">
            <Plus size={18} />
            Add Workout
          </button>
        </div>
      </div>
    </div>
  );
}
