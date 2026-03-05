"use client";
//  src/app/components/programs/ProgramClient.tsx
// import { useOptimistic, startTransition } from "react";
import Link from "next/link";
import { Program } from "@/types/program";
import {
  deleteProgram,
  duplicateProgram,
} from "@/app/(team)/programs/actions";
import { Copy, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function ProgramsPageClient({
  initialPrograms,
}: {
  initialPrograms: Program[];
}) {
  const [programs, setPrograms] = useState(initialPrograms);

  // Add this back if caching is still a problem
  //   useEffect(() => {
  //   setPrograms(initialPrograms);
  // }, [initialPrograms]);

  async function handleDelete(program: Program) {
    if (
      !window.confirm(
        "Deleting this workout will also remove all scheduled workouts for clients.\n\nThis action can’t be undone.",
      )
    )
      return;

    // Optimistic update
    setPrograms((prev) => prev.filter((p) => p.id !== program.id));

    try {
      await deleteProgram(program.id);
    } catch (err) {
      // rollback if needed
      setPrograms(initialPrograms);
      console.log("error deleting programs: ", err);
    }
  }

  async function handleDuplicate(program: Program) {
    const newId = await duplicateProgram(program.id);

    setPrograms((prev) => [
      {
        ...program,
        id: newId,
        name: `${program.name} (Copy)`,
      },
      ...prev,
    ]);
  }
  console.log("Programs: ", programs);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="nav-logo">Programs</h1>

        <Link href="/programs/new" className="btn-primary">
          <Plus size={18} />
          New Program
        </Link>
      </div>

      {/* Programs List */}
      {programs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-10 text-center">
          <h3 className="text-lg font-medium text-gray-700 mb-3">
            No programs yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create your first training program to get started.
          </p>
          <Link
            href="/programs/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={18} />
            Create Program
          </Link>
        </div>
      ) : (
        <div className="gradient-bg border border-surface2 rounded-2xl overflow-hidden divide-y divide-surface2">
          {" "}
          {programs.map((program) => (
            <div
              key={program.id}
              className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 
        hover:bg-white/50 hover:pl-6 transition-all duration-150 group
        border-l-2 border-l-transparent hover:border-l-lime-green/50"
            >
              <Link href={`/programs/${program.id}`} className="flex-1 min-w-0">
                <div className="font-syne font-bold text-sm text-foreground truncate group-hover:text-lime-green transition-colors">
                  {program.name}
                </div>
                {/* Optional: show more info if you have it */}
                <div className="text-sm text-gray-500 mt-0.5">
                  {program.notes}
                </div>
              </Link>

              <div className="flex items-center gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDuplicate(program)}
                  className="inline-flex items-center gap-1.5 text-sm text-muted transition"
                  title="Duplicate program"
                >
                  <Copy size={16} />
                  Duplicate
                </button>

                <button
                  onClick={() => handleDelete(program)}
                  className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 transition"
                  title="Delete program"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
