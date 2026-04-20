import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import VendorItemPricesClient from "./VendorItemPricesClient";
import VendorDefaultsClient from "./VendorDefaultsClient";

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [vendor, users] = await Promise.all([
    prisma.vendor.findUnique({
      where: { id },
      include: {
        itemPrices: {
          include: {
            item: {
              select: {
                id: true,
                itemNumber: true,
                manufacturer: true,
                description: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        },
        _count: { select: { purchaseOrders: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["TEAM", "ADMIN"] } },
      select: {
        id: true,
        profile: { select: { firstName: true, lastName: true } },
      },
      orderBy: { profile: { firstName: "asc" } },
    }),
  ]);

  if (!vendor) return notFound();

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link
          href="/vendors"
          className="flex items-center gap-2 text-sm text-[#666] hover:text-[#111] mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          Vendors
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#111] tracking-tight">
            {vendor.name}
          </h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-[#888]">
            {vendor.contact && <span>{vendor.contact}</span>}
            {vendor.email && <span>{vendor.email}</span>}
            {vendor.phone && <span>{vendor.phone}</span>}
              {vendor.bcId && <span>{vendor.bcId}</span>}
            <span>{vendor._count.purchaseOrders} POs</span>
            {!vendor.active && (
              <span className="text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                Inactive
              </span>
            )}
          </div>
          {vendor.notes && (
            <p className="mt-2 text-sm text-[#666]">{vendor.notes}</p>
          )}
        </div>

        <VendorDefaultsClient
          vendorId={id}
          defaults={{
            email: vendor.email,
            contact: vendor.contact,
            bcId: vendor.bcId,
            phone: vendor.phone,
            shipToContact: vendor.shipToContact,
            shipToAddress: vendor.shipToAddress,
            shipToAddress2: vendor.shipToAddress2,
            shipToCity: vendor.shipToCity,
            shipToState: vendor.shipToState,
            shipToZipcode: vendor.shipToZipcode,
            shipToCountry: vendor.shipToCountry,
            billToContact: vendor.billToContact,
            billToAddress: vendor.billToAddress,
            billToAddress2: vendor.billToAddress2,
            billToCity: vendor.billToCity,
            billToState: vendor.billToState,
            billToZipcode: vendor.billToZipcode,
            billToCountry: vendor.billToCountry,
            shippingMethod: vendor.shippingMethod,
            billingTerms: vendor.billingTerms,
            creditLimit: vendor.creditLimit ? Number(vendor.creditLimit) : null,
            defaultBuyerId: vendor.defaultBuyerId,
          }}
          users={users}
        />
        <VendorItemPricesClient
          vendorId={id}
          initialPrices={vendor.itemPrices}
        />
      </div>
    </div>
  );
}
