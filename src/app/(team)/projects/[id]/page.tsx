import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  FileText,
  Package,
  GitBranch,
  Truck,
  Clock,
  ShoppingCart,
  Plus,
  ArrowRight,
} from "lucide-react";
import ChangeOrderNotes from "@/app/components/ChangeOrderNotes";
import AllShipments from "@/app/components/shipments/AllShipments";
import MilestonesPanel from "@/app/components/MilestonesPanel";
import ScopesPanel from "@/app/components/ScopesPanel";
import BillingTermsEditor from "@/app/components/BillingTermsEditor";

const quoteStatusStyles: Record<string, string> = {
  ACCEPTED: "bg-green-100 text-green-700",
  SENT: "bg-blue-100 text-blue-700",
  REJECTED: "bg-red-100 text-red-600",
  DRAFT: "bg-gray-100 text-gray-600",
};

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;

  const [project, teamUsers] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        customer: true,
        shipments: true,
        timeEntries: true,
        purchaseOrders: true,
        milestones: { orderBy: { dueDate: "asc" } },
        quotes: {
          include: { lines: { include: { item: true, bundle: true } } },
          orderBy: { createdAt: "desc" },
        },
        changeOrders: { orderBy: { createdAt: "desc" } },
        boms: {
          include: { lines: { include: { item: true } }, quotes: true },
          orderBy: { createdAt: "desc" },
        },
        scopes: {
          select: {
            id: true,
            name: true,
            estimatedHours: true,
            itemId: true,
            item: true,
            timeEntries: {
              include: {
                user: { select: { id: true, email: true, profile: true } },
              },
              orderBy: { date: "desc" },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: "TEAM" },
      include: { profile: true },
    }),
  ]);

  if (!project) return notFound();

  const changeOrderTotal = project.changeOrders.reduce(
    (sum, co) => sum + co.amount,
    0,
  );

  const shipments = await prisma.shipment.findMany({
    include: {
      project: true,
      item: true,
      purchaseOrder: { select: { id: true, vendor: true } },
      salesOrder: { include: { customer: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-[#999] mb-1">{project.customer.name}</p>
            <h1 className="text-2xl font-bold text-[#111] tracking-tight">
              {project.name}
            </h1>
            <BillingTermsEditor projectId={project.id} billingTerms={project.billingTerms ?? null} />
          </div>
          {project.totalBudget != null && (
            <div className="text-right">
              <p className="text-xs text-[#999] mb-0.5">Budget</p>
              <p className="text-xl font-bold text-[#111]">
                ${project.totalBudget.toLocaleString()}
              </p>
              {project.invoiced != null && (
                <p className="text-xs text-[#999] mt-0.5">
                  ${project.invoiced.toLocaleString()} invoiced
                </p>
              )}
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-[#E5E3DE] rounded-2xl p-5 flex items-center gap-4 hover:border-[#111] hover:shadow-sm hover:bg-[#FAFAF9] transition-all duration-150">
            <div className="w-10 h-10 rounded-xl bg-[#F0EEE9] flex items-center justify-center flex-shrink-0">
              <Truck size={16} className="text-[#666]" />
            </div>
            <Link href={`/projects/${project.id}/shipments`}>
              <p className="text-2xl font-bold text-[#111]">
                {project.shipments.length}
              </p>
              <p className="text-xs text-[#999]">Shipments</p>
            </Link>
          </div>
          <div className="bg-white border border-[#E5E3DE] rounded-2xl p-5 flex items-center gap-4 hover:border-[#111] hover:shadow-sm hover:bg-[#FAFAF9] transition-all duration-150">
            <div className="w-10 h-10 rounded-xl bg-[#F0EEE9] flex items-center justify-center flex-shrink-0">
              <Clock size={16} className="text-[#666]" />
            </div>
            <Link href={`/projects/${project.id}/milestones`}>
              <p className="text-2xl font-bold text-[#111]">
                {project.timeEntries
                  .reduce((sum, t) => sum + t.hours, 0)
                  .toFixed(1)}
              </p>
              <p className="text-xs text-[#999]">Hours Logged</p>
            </Link>
          </div>
          <div className="bg-white border border-[#E5E3DE] rounded-2xl p-5 flex items-center gap-4 hover:border-[#111] hover:shadow-sm hover:bg-[#FAFAF9] transition-all duration-150">
            <div className="w-10 h-10 rounded-xl bg-[#F0EEE9] flex items-center justify-center flex-shrink-0">
              <ShoppingCart size={16} className="text-[#666]" />
            </div>
            <Link href={`/projects/${project.id}/purchase-orders`}>
              <p className="text-2xl font-bold text-[#111]">
                {project.purchaseOrders.length}
              </p>
              <p className="text-xs text-[#999]">Purchase Orders</p>
            </Link>
          </div>
        </div>

        <ScopesPanel
          projectId={project.id}
          initialScopes={project.scopes}
          teamUsers={teamUsers}
          currentUserId={currentUserId}
          acceptedQuotes={project.quotes
            .filter((q) => q.status === "ACCEPTED")
            .map((q) => ({ id: q.id, createdAt: q.createdAt.toISOString() }))}
        />

        {/* BOMs */}
        <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Package size={15} className="text-[#999]" />
              <h3 className="font-semibold text-sm text-[#111]">
                Bill of Materials
              </h3>
              <span className="text-xs text-[#bbb]">{project.boms.length}</span>
            </div>
            <Link
              href={`/projects/${project.id}/bom/new`}
              className="flex items-center gap-1.5 text-xs font-semibold bg-[#111] text-white px-3 py-1.5 rounded-lg hover:bg-[#333] transition-colors"
            >
              <Plus size={12} />
              New BOM
            </Link>
          </div>
          {project.boms.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-[#bbb]">
                No BOMs yet — create one to start building quotes
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F7F6F3]">
              {project.boms.map((bom) => (
                <Link
                  key={bom.id}
                  href={`/projects/${project.id}/bom/${bom.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-[#FAFAF9] transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium text-[#111]">
                      {bom.name}
                    </p>
                    <p className="text-xs text-[#999] mt-0.5">
                      {bom.lines.length} item{bom.lines.length !== 1 ? "s" : ""}{" "}
                      ·{" "}
                      {bom.quotes.length > 0
                        ? `${bom.quotes.length} quote${bom.quotes.length !== 1 ? "s" : ""} generated`
                        : "No quotes yet"}
                    </p>
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-[#ccc] group-hover:text-[#111] transition-colors"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quotes */}
        <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0EEE9] flex items-center gap-2.5">
            <FileText size={15} className="text-[#999]" />
            <h3 className="font-semibold text-sm text-[#111]">Quotes</h3>
            <span className="text-xs text-[#bbb]">{project.quotes.length}</span>
          </div>
          {project.quotes.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-[#bbb]">
                No quotes yet — generate one from a BOM
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F7F6F3]">
              {project.quotes.map((quote) => (
                <div key={quote.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-semibold text-[#111]">
                        #{quote.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${quoteStatusStyles[quote.status]}`}
                      >
                        {quote.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      {quote.total != null && (
                        <span className="text-sm font-semibold text-[#111]">
                          $
                          {quote.total.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      )}
                      <span className="text-xs text-[#999]">
                        {new Date(quote.createdAt).toLocaleDateString()}
                      </span>
                      <Link
                        href={`/projects/${project.id}/quotes/${quote.id}`}
                        className="flex items-center gap-1 text-xs font-semibold text-[#111] hover:underline"
                      >
                        Edit <ArrowRight size={11} />
                      </Link>
                      <Link
                        href={`/projects/${project.id}/quotes/${quote.id}`}
                        className="flex items-center gap-1 text-xs font-semibold text-[#666] hover:underline"
                      >
                        View <ArrowRight size={11} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Milestones */}
        <MilestonesPanel
          projectId={project.id}
          initialMilestones={project.milestones.map((m) => ({
            ...m,
            dueDate: m.dueDate?.toISOString() ?? null,
          }))}
        />

        <AllShipments shipments={shipments} />
        {/* Change Orders */}
        <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <GitBranch size={15} className="text-[#999]" />
              <h3 className="font-semibold text-sm text-[#111]">
                Change Orders
              </h3>
              <span className="text-xs text-[#bbb]">
                {project.changeOrders.length}
              </span>
            </div>
            {project.changeOrders.length > 0 && (
              <span
                className={`text-sm font-semibold ${changeOrderTotal >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {changeOrderTotal >= 0 ? "+" : ""}$
                {changeOrderTotal.toLocaleString()}
              </span>
            )}
          </div>
          {project.changeOrders.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-[#bbb]">No change orders yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F7F6F3]">
              {project.changeOrders.map((co) => (
                <div key={co.id} className="px-6 py-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#111]">{co.description}</p>
                      <p className="text-xs text-[#999] mt-0.5">
                        {new Date(co.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${co.amount >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {co.amount >= 0 ? "+" : ""}${co.amount.toLocaleString()}
                    </span>
                  </div>
                  <ChangeOrderNotes
                    changeOrderId={co.id}
                    currentUserId={currentUserId}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
