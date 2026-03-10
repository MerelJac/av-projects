import { Prisma } from "@prisma/client";

export type ShipmentWithRelations = Prisma.ShipmentGetPayload<{
  include: {
    project: true;
    item: true;
    purchaseOrder: { select: { id: true; vendor: true } };
    salesOrder: { include: { customer: true } };
  };
}>;