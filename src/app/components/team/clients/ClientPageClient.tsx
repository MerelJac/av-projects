"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { ClientListItem } from "@/types/client";
import AddClientForm from "../../clients/AddClientForm";

export default function ClientPageClient({
  initialClients,
}: {
  initialClients: ClientListItem[];
}) {
  // ✅ Client now owns the data
  const [clients, setClients] = useState<ClientListItem[]>(initialClients);

  // Add this back if caching is still a problem
  //   useEffect(() => {
  //     setClients(initialClients);
  //   }, [initialClients]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="nav-logo">Clients</h1>

        <div className="flex-shrink-0">
          <AddClientForm
            onClientCreated={(newClient: ClientListItem) => {
              setClients((prev) => [newClient, ...prev]);
            }}
          />
        </div>
      </div>

      {/* Clients List */}
      {clients.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-10 text-center">
          <h3 className="text-lg font-medium text-gray-700 mb-3">
            No clients added yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Add your first client to start tracking progress, assigning
            programs, and logging metrics.
          </p>
        </div>
      ) : (
     <div className="gradient-bg border border-surface2 rounded-2xl overflow-hidden divide-y divide-surface2">
  {clients.map((c) => (
    <div
      key={c.id}
      className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 
        hover:bg-white/50 hover:pl-6 transition-all duration-150 group
        border-l-2 border-l-transparent hover:border-l-lime-green/50"
    >
      <div className="min-w-0">
        <div className="font-syne font-bold text-sm text-foreground truncate group-hover:text-lime-green transition-colors">
          {c.profile?.firstName} {c.profile?.lastName || ""}
          {!c.profile?.firstName && !c.profile?.lastName && (
            <span className="text-muted">(no name)</span>
          )}
        </div>
        <div className="text-xs text-muted mt-0.5">{c.email}</div>
      </div>
      <div className="flex flex-row gap-2 items-center">
        {!c.profile?.waiverSignedAt && (
          <div className="relative group/tip">
            <AlertCircle size={16} className="text-amber-500 cursor-help" />
            <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-xl bg-white border border-surface2 px-3 py-1.5 text-xs text-foreground opacity-0 group-hover/tip:opacity-100 pointer-events-none transition z-50">
              Waiver has not been signed
            </div>
          </div>
        )}
        <Link
          href={`/clients/${c.id}`}
          className="px-4 py-2 rounded-xl bg-white border border-white/10 text-foreground text-xs font-semibold hover:border-lime-green/30 hover:text-lime-green transition-all active:scale-[0.97]"
        >
          View Profile
        </Link>
      </div>
    </div>
  ))}
</div>
      )}
    </div>
  );
}
