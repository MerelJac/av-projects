"use client";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function TeamDashboard() {
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white border rounded-xl p-6">
          <h3 className="text-sm text-gray-500">Active Projects</h3>
          <p className="text-3xl font-semibold mt-2">12</p>
        </div>

        <div className="bg-white border rounded-xl p-6">
          <h3 className="text-sm text-gray-500">Items</h3>
          <p className="text-3xl font-semibold mt-2">1,240</p>
        </div>

        <div className="bg-white border rounded-xl p-6">
          <h3 className="text-sm text-gray-500">Revenue (30d)</h3>
          <p className="text-3xl font-semibold mt-2">$82,400</p>
        </div>
      </div>
    </div>
  );
}
