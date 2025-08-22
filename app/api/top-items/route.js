import { NextResponse } from "next/server";

// Cache per 30 minuti
let cache = { key: "", data: null, ts: 0 };
const HALF_HOUR = 30 * 60 * 1000;

export async function GET(req) {
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") || "Chaos";
  const metric = url.searchParams.get("metric") || "lowest";
  const limit = Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10));
  const days = parseInt(url.searchParams.get("days") || "7", 10);
  const minSales = parseInt(url.searchParams.get("minSales") || "10", 10);
  const sample = parseInt(url.searchParams.get("sample") || "100", 10);

  const key = `${scope}|${metric}|${limit}|${days}|${minSales}|${sample}`;
  const now = Date.now();
  if (cache.data && cache.key === key && now - cache.ts < HALF_HOUR) {
    return NextResponse.json(cache.data);
  }

  try {
    const origin = req.nextUrl.origin;

    // 1) Prendiamo craftabili con volume reale
    const craftRes = await fetch(
      `${origin}/api/craftables-with-volume?scope=${encodeURIComponent(scope)}&days=${days}&minSales=${minSales}&sample=${sample}`,
      { cache: "no-store" }
    );
    const craftables = await craftRes.json();

    const results = [];

    // 2) Per ciascun item: calcolo BOM+ROI
    for (const item of craftables.slice(0, sample)) {
      try {
        const res = await fetch(
          `${origin}/api/bom?id=${item.id}&scope=${encodeURIComponent(scope)}&metric=${encodeURIComponent(metric)}`,
          { cache: "no-store" }
        );
        if (!res.ok) continue;
        const bom = await res.json();

        if (bom?.totals?.roi != null) {
          results.push({
            id: item.id,
            name: item.name,
            sales: item.sales,
            roi: bom.totals.roi,
            profitPerUnit: bom.totals.profitPerUnit,
            unitCost: bom.totals.unitMaterialCost,
            unitMarketPrice: bom.totals.unitMarketPrice,
            recipeId: item.recipeId,
          });
        }
      } catch (e) {
        console.warn("Errore calcolo BOM per", item.id, e);
      }
    }

    // 3) Ordiniamo per ROI decrescente
    results.sort((a, b) => b.roi - a.roi);

    const top = results.slice(0, limit);

    cache = { key, data: top, ts: now };

    return NextResponse.json(top);
  } catch (e) {
    console.error("Errore /api/top-items", e);
    return NextResponse.json([], { status: 500 });
  }
}
