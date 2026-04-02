import { Prisma } from "@prisma/client";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE";

/**
 * Returns a Prisma.AuditLogCreateInput ready to pass to prisma.auditLog.create({ data: ... }).
 * Designed to be dropped into existing $transaction calls with zero extra overhead.
 */
export function buildAuditLog(
  documentType: string,
  documentId: string,
  action: AuditAction,
  userId: string | null | undefined,
  summary?: string,
  changes?: Record<string, { from: unknown; to: unknown }>
): Prisma.AuditLogUncheckedCreateInput {
  return {
    documentType,
    documentId,
    action,
    userId: userId ?? null,
    summary: summary ?? null,
    changes: changes ? (changes as Prisma.InputJsonValue) : Prisma.JsonNull,
  };
}
