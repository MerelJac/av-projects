import { Prisma } from "@prisma/client";

export 
type Quote = {
  id: string;
  status: string;
  total: number | null;
  createdAt: Date;
};

export type QuoteWithDeposit = QuoteWithDetails & {
  depositPct: number | null;
  depositAmount: number | null;
  depositPaid: boolean;
  depositPaidAt: Date | null;
  depositInvoiceId: string | null;
};

export type QuoteWithDetails = Prisma.QuoteGetPayload<{
  include: {
    customer: true;
    project: true;
    boms: { include: { bom: { select: { id: true; name: true } } } };
    lines: { include: { item: true; bundle: true } };
    quoteBundles: { include: { lines: { include: { item: true } } } };
    salesOrder: { select: { id: true } };
  };
}> & {
  isDirect: boolean;
  isChangeOrder: boolean;
  scopeOfWork: string | null;
  termsAndConditions: string | null;
  clientResponsibilities: string | null;
};