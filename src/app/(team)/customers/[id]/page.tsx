import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Mail, Phone, Tag } from "lucide-react";
import DeleteCustomerButton from "./DeleteCustomerButton";
import EditCustomerButton from "./EditCustomerButton";
import CustomerSubscriptionsPanel from "../../subscriptions/CustomerSubscriptionPanel";
import { INVOICE_STYLES } from "../../projects/[id]/financial-report/page";

const quoteStatusStyles: Record<string, string> = {
  ACCEPTED: "bg-green-100 text-green-700",
  SENT: "bg-blue-100 text-blue-700",
  REJECTED: "bg-red-100 text-red-600",
  DRAFT: "bg-gray-100 text-gray-600",
};

export default async function CustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      projects: { orderBy: { createdAt: "desc" } },
      quotes: { orderBy: { createdAt: "desc" } },
      _count: { select: { itemPrices: true, subscriptions: true } },
    },
  });

  if (!customer) return notFound();

  const invoices = await prisma.invoice.findMany({
    where: {
      projectId: {
        in: customer.projects.map((p) => p.id),
      },
    },
  });

  const [subs, items] = await Promise.all([
    prisma.subscription.findMany({
      where: { customerId: customer.id },
      include: { item: true },
    }),
    prisma.item.findMany({ where: { type: "SUBSCRIPTION", active: true } }),
  ]);

  return (
    <div className="bg-[#F7F6F3]">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className=" flex flex-col gap-4">
            <h1 className="text-2xl font-bold text-[#111] tracking-tight">
              {customer.name}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              {customer.email && (
                <a
                  href={`mailto:${customer.email}`}
                  className="flex items-center gap-1.5 text-sm text-[#666] hover:text-[#111] transition-colors"
                >
                  <Mail size={13} />
                  {customer.email}
                </a>
              )}
              {customer.phone && (
                <span className="flex items-center gap-1.5 text-sm text-[#666]">
                  <Phone size={13} />
                  {customer.phone}
                </span>
              )}
              {customer.billingTerm && (
                <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-[#111] text-white rounded-lg">
                  {customer.billingTerm}
                </span>
              )}
              {customer.taxStatus && (
                <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-[#111] text-white rounded-lg">
                  {customer.taxStatus}
                </span>
              )}
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Billing Address
              </p>
              {customer.address && (
                <p className="text-sm text-gray-900">{customer.address}</p>
              )}
              {customer.address2 && (
                <p className="text-sm text-gray-500">{customer.address2}</p>
              )}
              {(customer.city || customer.state || customer.zipcode) && (
                <p className="text-sm text-gray-900">
                  {[customer.city, customer.state].filter(Boolean).join(", ")}
                  {customer.zipcode && ` ${customer.zipcode}`}
                </p>
              )}
              {customer.country && (
                <p className="text-sm text-gray-500">{customer.country}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <EditCustomerButton
              customer={{
                id: customer.id,
                name: customer.name,
                email: customer.email,
                taxStatus: customer.taxStatus,
                phone: customer.phone,
                billingTerm: customer.billingTerm,
              }}
            />
            <Link
              href={`/customers/${customer.id}/pricing`}
              className="flex items-center gap-1.5 text-sm font-semibold border border-[#E5E3DE] bg-white px-4 py-2 rounded-xl hover:bg-[#F7F6F3] transition-colors"
            >
              <Tag size={13} />
              Customer Pricing
            </Link>
            <DeleteCustomerButton
              customerId={customer.id}
              customerName={customer.name}
              projectCount={customer.projects.length}
              quoteCount={customer.quotes.length}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Projects */}
          <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#111]">Projects</h3>
              <span className="text-xs text-[#bbb]">
                {customer.projects.length}
              </span>
            </div>
            {customer.projects.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[#bbb] text-center">
                No projects yet
              </p>
            ) : (
              <div className="divide-y divide-[#F7F6F3]">
                {customer.projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-[#FAFAF9] transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[#111]">
                          {project.name}
                        </p>
                        {project.billingTerms && (
                          <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 bg-[#F0EEE9] text-[#666] rounded-md">
                            {project.billingTerms}
                          </span>
                        )}
                      </div>
                      {project.totalBudget != null && (
                        <p className="text-xs text-[#999] mt-0.5">
                          ${project.totalBudget.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <ArrowRight
                      size={13}
                      className="text-[#ccc] group-hover:text-[#111] transition-colors"
                    />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quotes */}
          <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#111]">Quotes</h3>
              <span className="text-xs text-[#bbb]">
                {customer.quotes.length}
              </span>
            </div>
            {customer.quotes.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[#bbb] text-center">
                No quotes yet
              </p>
            ) : (
              <div className="divide-y divide-[#F7F6F3]">
                {customer.quotes.map((quote) => (
                  <Link
                    key={quote.id}
                    href={
                      quote.projectId
                        ? `/projects/${quote.projectId}/quotes/${quote.id}`
                        : `/quotes/${quote.id}`
                    }
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-[#FAFAF9] transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-semibold text-[#111]">
                        #{quote.id.toUpperCase()}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${quoteStatusStyles[quote.status]}`}
                      >
                        {quote.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {quote.total != null && (
                        <span className="text-sm font-semibold text-[#111]">
                          ${quote.total.toLocaleString()}
                        </span>
                      )}
                      <ArrowRight
                        size={13}
                        className="text-[#ccc] group-hover:text-[#111] transition-colors"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <CustomerSubscriptionsPanel
            customerId={id}
            initialSubscriptions={subs}
            availableItems={items}
          />
          <div className="bg-white border border-[#E5E3DE] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F0EEE9] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#111]">Invoices</h3>
              <span className="text-xs text-[#bbb]">
                {invoices.length}
              </span>
            </div>
            {invoices.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[#bbb] text-center">
                No invoices yet
              </p>
            ) : (
              <div className="divide-y divide-[#F7F6F3]">
                {invoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={
                      invoice.projectId
                        && `/projects/${invoice.projectId}/invoices`
                    }
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-[#FAFAF9] transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-semibold text-[#111]">
                        #{invoice.id.toUpperCase()}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${INVOICE_STYLES[invoice.status]}`}
                      >
                        {invoice.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {invoice.amount != null && (
                        <span className="text-sm font-semibold text-[#111]">
                          ${invoice.amount.toLocaleString()}
                        </span>
                      )}
                      <ArrowRight
                        size={13}
                        className="text-[#ccc] group-hover:text-[#111] transition-colors"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
