// Quotation maths, shared by the dashboard editor, the client's quote page and the server.

export type QuoteItem = { description: string; qty: number; unit: string; rate: number };

export type QuoteTotals = { subtotal: number; discount: number; afterDiscount: number; tax: number; total: number };

const n = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

export function lineTotal(it: QuoteItem) {
  return Math.round(n(it.qty) * n(it.rate) * 100) / 100;
}

export function quoteTotals(items: QuoteItem[], discount: number, taxRate: number): QuoteTotals {
  const subtotal = items.reduce((sum, it) => sum + lineTotal(it), 0);
  const d = Math.min(Math.max(0, n(discount)), subtotal);
  const afterDiscount = subtotal - d;
  const tax = Math.round(afterDiscount * Math.max(0, n(taxRate))) / 100;
  return { subtotal, discount: d, afterDiscount, tax, total: Math.round((afterDiscount + tax) * 100) / 100 };
}

export function naira(v: number) {
  return "₦" + n(v).toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export const QUOTE_UNITS = ["item", "set", "sqm", "m", "room", "lot", "day", "hour"];

export function parseItems(json: string): QuoteItem[] {
  try {
    const arr = JSON.parse(json || "[]");
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, 200).map((x) => ({
      description: String(x?.description ?? "").slice(0, 500),
      qty: n(x?.qty),
      unit: String(x?.unit ?? "").slice(0, 20),
      rate: n(x?.rate),
    }));
  } catch {
    return [];
  }
}
