// src/app/components/trainer/TrainerProfileEditor.tsx
"use client";

import { useState, startTransition } from "react";
import { updateTrainerProfile } from "@/app/(team)/trainer/profile/actions";

export function TrainerProfileEditor({
  initialFirstName,
  initialLastName,
  initialEmail,

  initialPhone,
}: {
  initialFirstName?: string | null;
  initialLastName?: string | null;
  initialEmail: string;
  initialPhone: string | null | undefined;
}) {
  const [firstName, setFirstName] = useState(initialFirstName ?? "");
  const [lastName, setLastName] = useState(initialLastName ?? "");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null | undefined>(null);

  function save() {
    setSaving(true);
    setError(null);
    startTransition(async () => {
      const result = await updateTrainerProfile(
        firstName,
        lastName,
        email,
        phone,
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaving(false);
    });
  }

  return (
    <div className="bg-white border rounded-xl p-6 space-y-4">
      <h3 className="font-semibold text-gray-900">Edit Profile</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          className="rounded-lg border px-3 py-2 text-base"
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <input
          className="rounded-lg border px-3 py-2 text-base"
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />

        <input
          className="rounded-lg border px-3 py-2 text-base"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="rounded-lg border px-3 py-2 text-base"
          placeholder="Phone"
          type="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
