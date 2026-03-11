"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  clientId: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  role: string;
  onSave: () => void;
}

export function ClientProfileEditor({
  clientId,
  firstName = "",
  lastName = "",
  email,
  phone = "",
  onSave,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState({ firstName, lastName, email, phone });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save");
      }
      router.refresh();
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-5 space-y-5">
      {/* Name row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold tracking-widest uppercase text-muted">
            First Name
          </label>
          <input
            value={form.firstName}
            onChange={set("firstName")}
            placeholder="First"
            className="w-full px-3 py-2.5 rounded-xl border border-surface2 bg-white text-sm text-muted placeholder:text-muted/40 focus:outline-none focus:border-secondary-color/50 transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold tracking-widest uppercase text-muted">
            Last Name
          </label>
          <input
            value={form.lastName}
            onChange={set("lastName")}
            placeholder="Last"
            className="w-full px-3 py-2.5 rounded-xl border border-surface2 bg-white text-sm text-muted placeholder:text-muted/40 focus:outline-none focus:border-secondary-color/50 transition-colors"
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold tracking-widest uppercase text-muted">
          Email
        </label>
        <input
          type="email"
          value={form.email}
          onChange={set("email")}
          placeholder="email@example.com"
          className="w-full px-3 py-2.5 rounded-xl border border-surface2 bg-white text-sm text-muted placeholder:text-muted/40 focus:outline-none focus:border-secondary-color/50 transition-colors"
        />
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold tracking-widest uppercase text-muted">
          Phone
        </label>
        <input
          type="tel"
          value={form.phone}
          onChange={set("phone")}
          placeholder="(555) 000-0000"
          className="w-full px-3 py-2.5 rounded-xl border border-surface2 bg-white text-sm text-muted placeholder:text-muted/40 focus:outline-none focus:border-secondary-color/50 transition-colors"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-2.5 rounded-xl bg-secondary-color text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {loading ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}