import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, Users, Package, Receipt } from "lucide-react";

const reports = [
  {
    href: "/reports/bc/vendors",
    icon: Building2,
    label: "Vendor Report",
    description: "Compare Antares vendors against Business Central — auto-links by name",
  },
  {
    href: "/reports/bc/customers",
    icon: Users,
    label: "Customer Report",
    description: "Compare Antares customers against Business Central — auto-links by name",
  },
  {
    href: "/reports/bc/items",
    icon: Package,
    label: "Item Report",
    description: "Compare Antares items against Business Central by item number",
  },
  {
    href: "/reports/bc/invoices",
    icon: Receipt,
    label: "POS - Invoice Lines",
    description: "Coming soon",
    disabled: true,
  },
];

export default function BcReportsPage() {
  return (
    <div className="bg-[#F7F6F3] min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/reports"
            className="p-1.5 rounded-lg text-[#999] hover:text-[#111] hover:bg-white transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#111] tracking-tight">
              Business Central Reports
            </h1>
            <p className="text-xs text-[#999] mt-0.5">
              Live data pulled from BC on demand — records are auto-linked by name
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {reports.map(({ href, icon: Icon, label, description, disabled }) =>
            disabled ? (
              <div
                key={href}
                className="bg-white border border-[#E5E3DE] rounded-2xl px-6 py-5 opacity-40 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <Icon size={18} className="text-[#999]" />
                  <div>
                    <p className="text-sm font-semibold text-[#111]">{label}</p>
                    <p className="text-xs text-[#999] mt-0.5">{description}</p>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={href}
                href={href}
                className="bg-white border border-[#E5E3DE] rounded-2xl px-6 py-5 hover:border-[#111] transition-colors group flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <Icon size={18} className="text-[#999] group-hover:text-[#111] transition-colors" />
                  <div>
                    <p className="text-sm font-semibold text-[#111]">{label}</p>
                    <p className="text-xs text-[#999] mt-0.5">{description}</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-[#999] group-hover:text-[#111] transition-colors" />
              </Link>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
