export function formatDateFromInput(value: string | Date): Date {
  if (value instanceof Date) {
    return new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate(),
      12, // noon = timezone safe
    );
  }

  // string case
  const d = new Date(value);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
}

export function formatDateFromInputReturnString(value: string | Date): string {
  let d: Date;

  if (value instanceof Date) {
    // ALWAYS use UTC components
    d = new Date(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate(),
      12,
    );
  } else {
    // Handle strings explicitly
    if (value.includes("T")) {
      const parsed = new Date(value);
      d = new Date(
        parsed.getUTCFullYear(),
        parsed.getUTCMonth(),
        parsed.getUTCDate(),
        12,
      );
    } else {
      // YYYY-MM-DD
      const [y, m, day] = value.split("-").map(Number);
      d = new Date(y, m - 1, day, 12);
    }
  }

  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Convert a Date OR YYYY-MM-DD string into a
 * local, timezone-safe Date (normalized to noon).
 */
export function normalizeDate(value: string | Date): Date {
  console.log("Date coming in:", value);
  if (value instanceof Date) {
    return new Date(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate(),
      12, // noon local, stable
    );
  }

  // Expect YYYY-MM-DD
  const [year, month, day] = value.split("-").map(Number);
  console.log("Date going out:", new Date(year, month - 1, day, 12));

  return new Date(year, month - 1, day, 12);
}

/**
 * Convert a Date → YYYY-MM-DD for <input type="date">
 * Uses LOCAL date parts (never toISOString).
 */
export function toInputDate(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}
