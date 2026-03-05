"use client";

import { Exercise } from "@/types/exercise";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

export function ExerciseSearch({
  onSelect,
}: {
  onSelect: (exercise: Exercise) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch(`/api/exercises/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then(setResults)
      .catch((err) => {
        // ✅ Abort is expected — ignore it
        if (err.name !== "AbortError") {
          console.error(err);
        }
      })
      .finally(() => {
        // prevent state update after abort
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [query]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          className="w-fit rounded-md border px-9 py-2 text-sm"
          placeholder="Search exercises..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <ul className="max-h-56 overflow-y-auto rounded-md border divide-y">
        {loading && (
          <li className="px-3 py-2 text-sm text-gray-500">Searching…</li>
        )}

        {!loading &&
          results.map((ex) => (
            <li
              key={ex.id}
              onClick={() => onSelect(ex)}
              className="px-3 py-2 text-sm hover:bg-white cursor-pointer"
            >
              <div className="font-medium">{ex.name}</div>
              <div className="text-xs text-gray-500">
                {ex.type} • {ex.muscleGroup}
              </div>
            </li>
          ))}

        {!loading && query && results.length === 0 && (
          <li className="px-3 py-2 text-sm text-gray-500 flex flex-wrap">
            No exercises found. Click + New to create it.
          </li>
        )}
      </ul>
    </div>
  );
}
