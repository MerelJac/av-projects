"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoutButton } from "../Logout";
import { LucideIcon } from "lucide-react";

import {
  LayoutDashboard,
  Users,
  Dumbbell,
  ClipboardList,
  User2,
  Menu,
  X,
  GitCompare,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/exercises", label: "Exercise Library", icon: Dumbbell },
  { href: "/programs", label: "Programs", icon: ClipboardList },
];

const adminNavLinks = [
  { href: "/admin/exercises", label: "Review Exercises", icon: GitCompare },
];

export default function SidebarLayout({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function NavLink({
    href,
    label,
    icon: Icon,
    onClick,
  }: {
    href: string;
    label: string;
    icon: LucideIcon;
    onClick?: () => void;
  }) {
    const active = pathname === href;
    return (
      <Link
        href={href}
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          active
            ? "bg-lime-green/10 text-lime-green border border-lime-green/20"
            : "text-muted hover:text-foreground hover:bg-white border border-transparent"
        }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {label}
      </Link>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 h-14 bg-white/95 backdrop-blur-md border-b border-surface2 z-40 flex items-center px-4">
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-muted hover:text-foreground transition-colors"
        >
          <Menu className="w-4 h-4" />
        </button>
        <span className="ml-3 font-syne font-bold text-base text-lime-green">
          AV Projects
        </span>
      </header>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-white/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50
        w-64 bg-white border-r border-surface2 flex flex-col
        transform transition-transform duration-200
        ${open ? "translate-x-0" : "-translate-x-full"}
        md:sticky md:top-0 md:translate-x-0 md:h-screen
      `}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-surface2 flex items-center justify-between">
          <div>
            <h1 className="font-syne font-extrabold text-base text-lime-green tracking-tight">
              AV Projects
            </h1>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-muted mt-0.5">
              Trainer Dashboard
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="md:hidden w-8 h-8 rounded-xl bg-white flex items-center justify-center text-muted hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} onClick={() => setOpen(false)} />
          ))}
        </nav>

        {/* Admin section */}
        {role === "ADMIN" && (
          <div className="px-4 py-4 space-y-1 border-t border-surface2">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-muted px-3 mb-2">
              Admin
            </p>
            {adminNavLinks.map((item) => (
              <NavLink
                key={item.href}
                {...item}
                onClick={() => setOpen(false)}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-4 space-y-1 border-t border-surface2">
          <NavLink
            href="/trainer/profile"
            label="Profile"
            icon={User2}
            onClick={() => setOpen(false)}
          />
          <LogoutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 pt-20 md:pt-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
