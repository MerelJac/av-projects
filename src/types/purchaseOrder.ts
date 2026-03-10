import { Prisma } from "@prisma/client";

export type POWithDetails = Prisma.PurchaseOrderGetPayload<{
  include: {
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