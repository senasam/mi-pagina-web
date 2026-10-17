export function normalizeNumericInput(rawValue) {
  const raw = String(rawValue ?? "").trim().replace(/\s/g, "");
  if (!raw) return "";
  const negative = raw.startsWith("-");
  const unsigned = raw.replace(/-/g, "").replace(/[^\d.,]/g, "");
  if (!unsigned) return negative ? "-" : "";

  if (unsigned.includes(",")) {
    const comma = unsigned.lastIndexOf(",");
    const integer = unsigned.slice(0, comma).replace(/[.,]/g, "") || "0";
    const decimals = unsigned.slice(comma + 1).replace(/[.,]/g, "");
    return `${negative ? "-" : ""}${integer}.${decimals}`;
  }

  const dots = unsigned.split(".");
  if (dots.length > 1) {
    const looksGrouped = dots.length > 2 || (dots[1].length === 3 && dots[0].length > 0);
    if (looksGrouped) return `${negative ? "-" : ""}${dots.join("")}`;
    const decimals = dots.pop();
    return `${negative ? "-" : ""}${dots.join("") || "0"}.${decimals}`;
  }

  return `${negative ? "-" : ""}${unsigned}`;
}

export function formatNumericInput(value) {
  if (value === "" || value == null) return "";
  const canonical = String(value).replace(",", ".");
  if (canonical === "-") return canonical;
  const negative = canonical.startsWith("-");
  const unsigned = canonical.replace("-", "");
  const [integer = "", decimals] = unsigned.split(".");
  const grouped = (integer || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${negative ? "-" : ""}${grouped}${decimals !== undefined ? `,${decimals}` : ""}`;
}

// Lee lo que el usuario escribe sobre un valor ya formateado por formatNumericInput (punto de miles, coma decimal).
// A diferencia de normalizeNumericInput, nunca trata el punto como decimal: al teclear el cuarto cero
// de "1.000" el campo muestra "1.0000", que debe leerse como 10000 y no como 1,0000.
export function parseDisplayedNumber(rawValue, integer = false) {
  const text = String(rawValue ?? "").replace(/[^\d,]/g, "");
  const [whole, ...rest] = text.split(",");
  if (integer || !rest.length) return whole;
  return `${whole || "0"}.${rest.join("")}`;
}
