"use client";

import { useState, startTransition } from "react";
import { createClient } from "@/app/(team)/clients/actions";
import { ClientListItem } from "@/types/client";


type Props = {
  onClientCreated?: (client: ClientListItem) => void;
};

export default function AddClientForm({ onClientCreated }: Props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null | undefined>(null);
  const [saving, setSaving] = useState(false);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setSaving(true);
    setError(null);

    startTransition(async () => {
      try {
        const result = await createClient(email);

        if (!result.ok) {
          setSaving(false);
          setError(result.error);
          return;
        }

        setEmail("");
        setSaving(false);

        // ✅ Update parent list immediately
        if (onClientCreated && result.client) {
          onClientCreated(result.client);
        }
      } catch (err) {
        setSaving(false);
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }
  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="client@example.com"
          required
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-base"
        />
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="btn-primary disabled:opacity-50"
        >
          {saving ? "Creating…" : "Add client"}
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
