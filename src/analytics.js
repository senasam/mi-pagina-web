const SAFE_DIMENSIONS = new Set(["channel", "tone", "module", "destination", "resource", "tool", "category", "section", "mode", "status"]);

export function trackEvent(name, dimensions = {}) {
  const safeDimensions = Object.fromEntries(
    Object.entries(dimensions).filter(([key, value]) => SAFE_DIMENSIONS.has(key) && typeof value === "string"),
  );

  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") window.gtag("event", name, safeDimensions);
  else if (typeof window.plausible === "function") window.plausible(name, { props: safeDimensions });
  else if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: name, ...safeDimensions });
}
