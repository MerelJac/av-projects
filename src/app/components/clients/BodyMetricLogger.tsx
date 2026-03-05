"use client";

import { useState } from "react";
import { addMyBodyMetric } from "@/app/(client)/profile/actions";

export function BodyMetricLogger() {
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    setLoading(true);

    if (weight || bodyFat) {
      // ONLY ALLOW IF AT LEAST ONE IS PRESENT
      await addMyBodyMetric(
        weight ? Number(weight) : null,
        bodyFat ? Number(bodyFat) : null,
      );
    }

    setWeight("");
    setBodyFat("");
    setLoading(false);

  }

  return (
    <div className="w-full max-w-sm space-y-4 flex flex-col items-center">
      <div className="grid grid-cols-2 gap-3">
        {/* Weight */}
        <div className="body-stat">
          <label className="bs-label">Weight</label>
          <input
            type="number"
            step="0.1"
            placeholder="lbs"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
          />
        </div>

        {/* Body Fat */}
        <div className="body-stat">
          <label className="bs-label">Body Fat %</label>
          <input
            type="number"
            step="0.1"
            placeholder="%"
            value={bodyFat}
            onChange={(e) => setBodyFat(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
          />
        </div>
      </div>

      {/* Action */}
      <button
        onClick={handleAdd}
        disabled={loading}
        className={`btn-primary
        ${
          loading
            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {loading ? "Saving…" : "Add Metrics"}
      </button>
    </div>
  );
}
