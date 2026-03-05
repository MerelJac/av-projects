"use client";

import { ClientHeader } from "../components/clients/ClientHeader";

// src/app/(client)/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden
">
      <ClientHeader />

      <main className="p-6  mx-auto bg-white">{children}</main>
    </div>
  );
}
