// src/utils/assertPrescribed.ts
import { Prescribed } from "@/types/prescribed";

export function assertPrescribed(value: unknown): Prescribed {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid prescribed payload");
  }

  if (!("kind" in value)) {
    throw new Error("Invalid prescribed payload");
  }

  return value as Prescribed;
}
