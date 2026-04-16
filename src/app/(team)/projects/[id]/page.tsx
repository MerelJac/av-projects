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
  Receipt,
  Download,
  Eye,
} from "lucide-react";
import AllShipments from "@/app/components/shipments/AllShipments";
import MilestonesPanel from "@/app/components/MilestonesPanel";
import ScopesPanel from "@/app/components/ScopesPanel";
import BillingTermsEditor from "@/app/components/BillingTermsEditor";
import DeleteProjectButton from "@/app/components/projects/DeleteProjectButton";
import { calcProjectFinancials } from "@/lib/utils/financials";
import AuditFeed from "@/app/components/AuditFeed";
import BomNameEditor from "@/app/components/bom/BomNameEditor";

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
        costs: true,
        customer: true,
        shipments: true,
        timeEntries: true,
        purchaseOrders: {
          include: { lines: true, vendor: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        milestones: { orderBy: { dueDate: "asc" } },
        quotes: {
          include: { lines: { include: { item: true, bundle: true } } },
          orderBy: { createdAt: "desc" },
        },
        boms: {
          include: { lines: { include: { item: true } }, quotes: true },
          orderBy: { createdAt: "desc" },
        },
        scopes: {
          select: {
            id: true,
            name: true,
            estimatedHours: true,
            ratePerHour: true,
            costPerHour: true,
            itemId: true,
            item: true,
            timeEntries: {
              include: {
                user: { select: { id: true, email: true, profile: true } },
              },
              orderBy: { date: "desc" },
            },
            invoiceLines: { select: { id: true, quantity: true, price: true } },
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

  const financials = calcProjectFinancials({
    quotes: project.quotes,
    projectCosts: project.costs,
    scopes: project.scopes,
    invoices: project.invoices,
  });
  const changeOrders = project.quotes.filter((q) => q.isChangeOrder);
  const contractBase = financials.contractBase;
  const changeOrderTotal = financials.changeOrderTotal;
  const totalContract = financials.totalContract;

  const shippingCost = financials.shippingCost;
  const returnCredit = financials.returnCredit;
  const materialsIncludingReturns = financials.poCostGrossMinusReturns;
  const laborCost = financials.laborCost;
  const cogs = financials.cogs;
  const invoiced = financials.invoiced;
  const collected = financials.collected;
  const owed = totalContract - invoiced;

  const grossProfit = financials.grossProfit;
  const marginPct = financials.marginPct;

  // Price-side (sell price allocated from BOM lines)
  const netMaterialPrice = financials.netMaterialPrice;
  const materialMarkup = financials.materialMarkup;

  const shipments = await prisma.shipment.findMany({
    where: { projectId: id },
    include: {
      project: true,
      item: true,
      purchaseOrder: { select: { id: true, vendor: true } },
      salesOrder: { include: { customer: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="bg-[#F7F6F3]">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-[#999] mb-1">{project.customer.name}</p>
            <h1 className="text-2xl font-bold text-[#111] tracking-tight">
              {project.name}
            </h1>
            <BillingTermsEditor
              projectId={project.id}
              billingTerms={project.billingTerms ?? null}
            />
          </div>
          {totalContract > 0 && (
            <div className="text-right">
              <p className="text-xs text-[#999] mb-0.5">Budget</p>
              <p className="text-xl font-bold text-[#111]">
                $
                {totalContract.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-[#999] italic mt-0.5">
                from approved proposals
              </p>
            </div>
          )}
        </div>

        {/* Financial Summary */}
        {totalContract > 0 && (
          <div className="bg-white border border-[#E5E3DE] rounded-2xl ">
            <div className="px-6 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
              <h3 className="font-semibold text-sm text-[#111]">
                Financial Summary
              </h3>
              <Link
                href={`/projects/${id}/financial-report`}
                className="flex items-center gap-1.5 text-xs text-[#666] hover:text-[#111] transition-colors"
              >
                <Eye size={12} />
                View report
              </Link>
            </div>
            <div className="grid grid-cols-4 divide-x divide-[#F0EEE9]">
              {/* Budget */}
              <div className="px-5 py-4">
                <p className="text-xs text-[#999] uppercase tracking-widest mb-1">
                  Budget
                </p>
                <p className="text-lg font-bold text-[#111]">
                  $
                  {totalContract.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                {changeOrderTotal !== 0 && (
                  <p className="text-xs text-[#999] mt-0.5">
                    $
                    {contractBase.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    base
                    {changeOrderTotal >= 0 ? " +" : " "}$
                    {changeOrderTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    COs
                  </p>
                )}
              </div>

              {/* Spent */}
              <div className="px-5 py-4">
                <p className="text-xs text-[#999] uppercase tracking-widest mb-1">
                  COGS
                </p>
                <p className="text-lg font-bold text-[#111]">
                  $
                  {cogs.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                {materialsIncludingReturns > 0 && (
                  <p className="text-xs text-[#999] mt-0.5">
                    $
                    {materialsIncludingReturns.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    materials
                    {netMaterialPrice > 0 && (
                      <span className="text-[#bbb]">
                        {" "}→ $
                        {netMaterialPrice.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        sell
                        {materialMarkup !== null && (
                          <span className="text-green-600 font-medium">
                            {" "}({materialMarkup > 0 ? "+" : ""}{materialMarkup.toFixed(0)}%)
                          </span>
                        )}
                      </span>
                    )}
                  </p>
                )}
                {laborCost > 0 && (
                  <p className="text-xs text-[#999] mt-0.5">
                    $
                    {laborCost.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    labor
                  </p>
                )}
                {shippingCost > 0 && (
                  <p className="text-xs text-[#999] mt-0.5">
                    $
                    {shippingCost.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    shipping
                  </p>
                )}
                {returnCredit > 0 && (
                  <p className="text-xs text-green-600 mt-0.5">
                    −$
                    {returnCredit.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    returns
                  </p>
                )}
              </div>

              {/* Collected */}
              <div className="px-5 py-4">
                <p className="text-xs text-[#999] uppercase tracking-widest mb-1">
                  Collected
                </p>
                <p className="text-lg font-bold text-green-600">
                  $
                  {collected.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                {invoiced > 0 && (
                  <p className="text-xs text-[#999] mt-0.5">
                    $
                    {invoiced.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    invoiced
                  </p>
                )}
                {invoiced > collected && (
                  <p className="text-xs text-amber-600 font-medium mt-0.5">
                    $
                    {(invoiced - collected).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    outstanding
                  </p>
                )}
                {totalContract > invoiced && (
                  <p className="text-xs text-[#bbb] mt-0.5">
                    $
                    {owed.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    not yet invoiced
                  </p>
                )}
              </div>

              {/* Profit */}
              <div className="px-5 py-4">
                <p className="text-xs text-[#999] uppercase tracking-widest mb-1">
                  Profit
                </p>
                <p
                  className={`text-lg font-bold ${grossProfit >= 0 ? "text-green-600" : "text-red-500"}`}
                >
                  $
                  {grossProfit.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                {marginPct !== null && (
                  <p className="text-xs text-[#999] mt-0.5">
                    {marginPct.toFixed(1)}% margin
                  </p>
                )}
                <p className="text-xs text-[#bbb] mt-0.5">
                  budget − (spent + owed)
                </p>
              </div>
            </div>
          </div>
        )}

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
                {project.scopes
                  .flatMap((sc) => sc.timeEntries)
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

        {/* BOMs */}
        <div className="bg-white border border-[#E5E3DE] rounded-2xl ">
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
                No BOMs yet — create one to build quotes and purchase orders
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
                    <BomNameEditor
                      projectId={project.id}
                      bomId={bom.id}
                      initialName={bom.name}
                    />
                    <p className="text-xs text-[#999] mt-0.5">
                      {bom.lines.length} item{bom.lines.length !== 1 ? "s" : ""}{" "}
                      ·{" "}
                      {bom.quotes.length > 0
                        ? `${bom.quotes.length} proposal${bom.quotes.length !== 1 ? "s" : ""} generated`
                        : "No proposals yet"}
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
        <div className="bg-white border border-[#E5E3DE] rounded-2xl ">
          <div className="px-6 py-4 border-b border-[#F0EEE9] flex items-center gap-2.5">
            <FileText size={15} className="text-[#999]" />
            <h3 className="font-semibold text-sm text-[#111]">Documents</h3>
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
              {/* filter out change orders for this section since they are surfaced separately below */}
              {project.quotes
                .filter((q) => !q.isChangeOrder)
                .map((quote) => (
                  <div key={quote.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-semibold text-[#111]">
                          #{quote.id.toUpperCase()}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${quoteStatusStyles[quote.status]}`}
                        >
                          {quote.status} {quote.isDirect && "· Direct"}{" "}
                          {quote.isChangeOrder && "· Change Order"}{" "}
                          {!quote.isChangeOrder &&
                            !quote.isDirect &&
                            "· Proposal"}
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
                          href={`/projects/${project.id}/proposals/${quote.id}`}
                          className="flex items-center gap-1 text-xs font-semibold text-[#666] hover:underline"
                        >
                          <ArrowRight size={11} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <ScopesPanel
          projectId={project.id}
          initialScopes={project.scopes}
          teamUsers={teamUsers}
          currentUserId={currentUserId}
          projectBoms={project.boms.map((b) => ({ id: b.id, name: b.name }))}
        />

        {/* Purchase Orders */}
        <div className="bg-white border border-[#E5E3DE] rounded-2xl ">
          <div className="px-6 py-4 border-b border-[#F0EEE9] flex items-center gap-2.5">
            <ShoppingCart size={15} className="text-[#999]" />
            <h3 className="font-semibold text-sm text-[#111]">
              Purchase Orders
            </h3>
            <span className="text-xs text-[#bbb]">
              {project.purchaseOrders.length}
            </span>
          </div>
          {project.purchaseOrders.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-[#bbb]">
                No purchase orders yet — create one from a BOM or quote
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F7F6F3]">
              {project.purchaseOrders.map((po) => {
                const receivedAll = po.lines.every(
                  (l) => l.receivedQuantity >= l.quantity,
                );
                const receivedSome = po.lines.some(
                  (l) => l.receivedQuantity > 0,
                );
                const statusLabel =
                  po.status === "RECEIVED"
                    ? "Received"
                    : po.status === "PARTIALLY_RECEIVED"
                      ? "Partial"
                      : po.status === "PARTIALLY_RETURNED"
                        ? "Partially Returned"
                        : po.status === "RETURNED"
                          ? "Returned"
                          : po.status === "SENT"
                            ? "Sent"
                            : "Draft";
                const statusColor =
                  po.status === "RECEIVED"
                    ? "bg-green-100 text-green-700"
                    : po.status === "PARTIALLY_RECEIVED" ||
                        po.status === "PARTIALLY_RETURNED" ||
                        po.status === "RETURNED"
                      ? "bg-amber-100 text-amber-700"
                      : po.status === "SENT"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600";
                return (
                  <Link
                    key={po.id}
                    href={`/projects/${project.id}/purchase-orders/${po.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-[#FAFAF9] transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2.5">
                        <p className="text-sm font-medium text-[#111]">
                          {po.poNumber ?? "PO"}
                          {po.vendor ? ` · ${po.vendor.name}` : ""}
                        </p>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor}`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      <p className="text-xs text-[#999] mt-0.5">
                        {po.lines.length} line{po.lines.length !== 1 ? "s" : ""}{" "}
                        · {new Date(po.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-[#ccc] group-hover:text-[#111] transition-colors"
                    />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Invoices */}
        <div className="bg-white border border-[#E5E3DE] rounded-2xl ">
          <div className="px-6 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Receipt size={15} className="text-[#999]" />
              <h3 className="font-semibold text-sm text-[#111]">Invoices</h3>
              <span className="text-xs text-[#bbb]">
                {project.invoices.length}
              </span>
            </div>
            <Link
              href={`/projects/${project.id}/invoices`}
              className="flex items-center gap-1 text-xs font-semibold text-[#666] hover:text-[#111] transition-colors"
            >
              View all <ArrowRight size={11} />
            </Link>
          </div>
          {project.invoices.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-[#bbb]">No invoices yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F7F6F3]">
              {project.invoices.map((inv) => {
                const statusColor =
                  inv.status === "PAID"
                    ? "bg-green-100 text-green-700"
                    : inv.status === "SENT" || inv.status === "PENDING"
                      ? "bg-blue-100 text-blue-700"
                      : inv.status === "VOID"
                        ? "bg-gray-100 text-gray-400"
                        : inv.status === "REJECTED"
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-600";
                return (
                  <Link
                    key={inv.id}
                    href={`/projects/${project.id}/invoices`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-[#FAFAF9] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-[#111]">
                        {inv.invoiceNumber ?? `#${inv.id.toUpperCase()}`}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor}`}
                      >
                        {inv.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      {inv.amount != null && (
                        <span className="text-sm font-semibold text-[#111]">
                          $
                          {inv.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      )}
                      <span className="text-xs text-[#999]">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </span>
                      <ArrowRight
                        size={14}
                        className="text-[#ccc] group-hover:text-[#111] transition-colors"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

       

        <AllShipments shipments={shipments} />
        {/* Change Orders */}
        <div className="bg-white border border-[#E5E3DE] rounded-2xl ">
          <div className="px-6 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <GitBranch size={15} className="text-[#999]" />
              <h3 className="font-semibold text-sm text-[#111]">
                Change Orders
              </h3>
              <span className="text-xs text-[#bbb]">{changeOrders.length}</span>
            </div>
          </div>
          {changeOrders.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-[#bbb]">No change orders yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F7F6F3]">
              {changeOrders.map((co) => (
                <div key={co.id} className="px-6 py-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-semibold text-[#111]">
                        #{co.id.toUpperCase()}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${quoteStatusStyles[co.status]}`}
                      >
                        {co.status}
                      </span>
                      <p className="text-xs text-[#999] mt-0.5">
                        {new Date(co.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${co.total != null && co.total >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {co.total != null && (
                        <span className="text-sm font-semibold text-[#111]">
                          $
                          {co.total.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      )}
                    </span>
                    <Link
                      href={`/projects/${project.id}/proposals/${co.id}`}
                      className="flex items-center gap-1 text-xs font-semibold text-[#666] hover:underline"
                    >
                      View <ArrowRight size={11} />
                    </Link>
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
      </div>
      <DeleteProjectButton id={project.id} />
    </div>
  );
}
