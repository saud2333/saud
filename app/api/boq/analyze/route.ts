type BoqItem = { item: string; description: string; quantity: number; unit: string; rate: number | null; amount: number | null };

function parseCsv(text: string): BoqItem[] {
  const lines = text.replace(/\r/g, "").split("\n").filter(Boolean).slice(0, 1000);
  if (lines.length < 2) return [];
  return lines.slice(1).map((line, index) => {
    const columns = line.split(",").map((value) => value.trim().replace(/^"|"$/g, ""));
    const quantity = Number(columns[2]) || 0;
    const rateValue = columns[4] === undefined || columns[4] === "" ? null : Number(columns[4]);
    const rate = rateValue !== null && Number.isFinite(rateValue) ? rateValue : null;
    return { item: columns[0] || String(index + 1), description: columns[1] || "", quantity, unit: columns[3] || "unit", rate, amount: rate === null ? null : quantity * rate };
  });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return Response.json({ error: "Use application/json with a CSV text field. Binary PDF/Excel analysis requires the document-analysis provider." }, { status: 415 });
  const payload = await request.json().catch(() => null) as { text?: string; format?: string } | null;
  const text = payload?.text ?? "";
  if (!text || text.length > 2_000_000) return Response.json({ error: "CSV text is required and must be under 2 MB" }, { status: 400 });
  if ((payload?.format ?? "csv").toLowerCase() !== "csv") return Response.json({ error: "Only CSV text extraction is enabled until an external document-analysis provider is connected." }, { status: 422 });
  const items = parseCsv(text);
  return Response.json({ data: { items, totals: { known_amount: items.reduce((sum, item) => sum + (item.amount ?? 0), 0), missing_rates: items.filter((item) => item.rate === null).length }, assumptions: ["Comma-separated columns: item, description, quantity, unit, rate", "No market rates were added or inferred", "Ambiguous rows require human review"] } });
}
