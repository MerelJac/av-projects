"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

type AuditEntry = {
  id: string;
  action: string;
  summary: string | null;
  createdAt: string;
  user: {
    id: string;
    profile: { firstName: string; lastName: string } | null;
  } | null;
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function userName(entry: AuditEntry): string {
  if (!entry.user) return "System";
  if (entry.user.profile) {
    return `${entry.user.profile.firstName} ${entry.user.profile.lastName}`;
  }
  return "Unknown";
}

export default function AuditFeed({
  documentType,
  documentId,
}: {
  documentType: string;
  documentId: string;
}) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;
    fetch(`/api/audit?documentType=${documentType}&documentId=${documentId}`)
      .then((r) => r.json())
      .then((data) => {
        setEntries(Array.isArray(data) ? data : []);
        setLoaded(true);
      });
      console.log("Fetching audit log for", documentType, documentId);
  }, [open, loaded, documentType, documentId]);

  return (
    <div className="px-5 pb-3 border-t border-[#F0EEE9] pt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#999] hover:text-[#666] transition-colors w-full text-left"
      >
        <Clock size={10} />
        Activity
        {entries.length > 0 && !open && (
          <span className="ml-1 text-[#bbb] font-normal normal-case tracking-normal">
            ({entries.length})
          </span>
        )}
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {entries.length === 0 ? (
            <p className="text-[10px] text-[#bbb]">No activity recorded yet.</p>
          ) : (
            entries.map((e) => (
              <div key={e.id} className="flex items-start gap-2 text-[11px] text-[#666]">
                <div className="w-1 h-1 rounded-full bg-[#ccc] mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-[#444]">{userName(e)}</span>
                  {e.summary && (
                    <span className="ml-1 text-[#777]">— {e.summary}</span>
                  )}
                  <span className="ml-1.5 text-[#bbb]">{relativeTime(e.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
