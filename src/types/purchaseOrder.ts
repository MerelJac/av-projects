import { Prisma } from "@prisma/client";

export type POWithDetails = Prisma.PurchaseOrderGetPayload<{
  include: {
    vendor: true;
    lines: {
      include: {
        item: true;
        salesOrderLine: true;
      };
    };
    shipments: {
      include: {
        item: true;
      };
    };
  };
}>;

type SalesOrderLineRaw = NonNullable<POWithDetails["lines"][number]["salesOrderLine"]>;
type SalesOrderLineForClient = Omit<SalesOrderLineRaw, "price" | "cost"> & {
  price: number;
  cost: number | null;
};

type POLineForClient = Omit<POWithDetails["lines"][number], "salesOrderLine"> & {
  salesOrderLine: SalesOrderLineForClient | null;
};

export type POWithDetailsForClient = Omit<POWithDetails, "lines"> & {
  lines: POLineForClient[];
};