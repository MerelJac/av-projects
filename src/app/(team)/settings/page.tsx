import Link from "next/link";
import { Tag, Users } from "lucide-react";

const sections = [
  {
    href: "/settings/item-options",
    icon: Tag,
    label: "Item Options",
    description: "Manage dropdown options for item categories and units",
  },
    {
    href: "/settings/salespeople",
    icon: Users,
    label: "Salespeople",
    description: "Manage dropdown options for salespeople",
  },
];

export default function SettingsPage() {
  return (
    <div className="bg-[#F7F6F3] min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#111] tracking-tight">Settings</h1>
          <p className="text-sm text-[#999] mt-1">Manage configuration and defaults.</p>
        </div>

        <div className="space-y-3">
          {sections.map(({ href, icon: Icon, label, description }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 bg-white border border-[#E5E3DE] rounded-2xl px-5 py-4 hover:bg-[#FAFAF9] transition-colors group"
            >
              <div className="w-9 h-9 rounded-xl bg-[#F7F6F3] flex items-center justify-center flex-shrink-0 group-hover:bg-[#F0EEE9] transition-colors">
                <Icon size={16} className="text-[#666]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#111]">{label}</p>
                <p className="text-xs text-[#999] mt-0.5">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
