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
