export function buildAddress({
  address1,
  address2,
  city,
  state,
  zipCode,
  country,
}: {
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
}) {
  const line1 = address1;

  const line2 = address2;

  const line3 = [city, state, zipCode]
    .filter(Boolean)
    .join(", ")
    .replace(", ,", ",");

  return [line1, line2, line3, country].filter(Boolean).join("\n");
}
