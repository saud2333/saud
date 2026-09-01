import { verifiedSuppliers } from "../../data/catalog";

export async function GET() {
  return Response.json({
    data: verifiedSuppliers,
    meta: {
      mode: "source-linked",
      source: "official supplier websites",
      last_updated: "2026-09-01",
      confidence: "official-contact-data",
      notice: "Contact and product-line data link to official supplier websites. Live prices are not inferred; request a current quote and verify product certificates.",
    },
  });
}
