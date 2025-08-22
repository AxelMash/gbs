import { NextResponse } from "next/server";

/**
 * Incrocia craftabili (da /api/craftables) con i volumi di vendita recenti (Universalis history).
 * Parametri:
 *   ?scope=Chaos            DC o World (default: Chaos)
 *   ?days=7                 finestra temporale (default: 7 giorni)
 *   ?minSales=10            filtro minimo vendite (default: 10)
 *   ?sample=200             quanti item testare (default: 200)
 *   ?maxPages=20            fino a quante pagine leggere da /api/craftables (default: 20)
 *
 * Cache in memoria: 6 ore (evita di stressare le API).
 */

let cache = { key: "", data: null, ts: 0 };
const SIX_HOURS = 6 * 60 * 60 * 1000;

export async function GET(req) {
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") || "Chaos";
  const days = Math.max(1, parseInt(url.searchParams.get("days") || "7", 10));
  const minSales = Math.max(0, parseInt(url.searchParams.get("minSales") || "10", 10));
  const sample = Math.max(1, parseInt(url.searchParams.get("sample") || "200", 10));
  const maxPages = Math.max(1, parseInt(url.searchParams.get("maxPages") || "20", 10));

  const key = `${scope}|${days}|${minSales}|${sample}|${maxPages}`;
  const now = Date.now();
  if (cache.data && cache.key === key && (now - cache.ts) < SIX_HOURS) {
    return NextResponse.json(cache.data, {
      headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=3600" },
    });
  }

  const origin = req.nextUrl.origin;

  const safeJSON = async (resp) => {
    if (!resp) return null;
    const text = await resp.text();
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      // evitiamo crash: logghiamo le prime linee
      console.error("Risposta NON JSON:", text?.slice(0, 200));
      return null;
    }
  };

  // 1) Otteniamo craftabili (limitando le pagine)
  let craftables = [];
  try {
    const craftRes = await fetch(`${origin}/api/craftables?maxPages=${maxPages}`, { cache: "no-store" });
    if (!craftRes.ok) {
      const dbg = await craftRes.text();
      console.error("Errore /api/craftables:", craftRes.status, dbg?.slice(0, 200));
      return NextResponse.json([], { status: 502 });
    }
    const data = await safeJSON(craftRes);
    craftables = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Errore chiamando /api/craftables:", e);
    return NextResponse.json([], { status: 502 });
  }

  // 2) Campioniamo i primi N (puoi randomizzare se preferisci)
  const subset = craftables.slice(0, sample);

  // 3) Per ciascun item: Universalis history → volume ultimi N giorni
  const since = Math.floor((now - days * 24 * 60 * 60 * 1000) / 1000); // unix seconds

  const withVolumes = [];
  for (const it of subset) {
    try {
      // prendi un po' di history recente (entries=300 di solito basta per 7-14gg)
      const histRes = await fetch(`https://universalis.app/api/v2/history/${encodeURIComponent(scope)}/${it.id}?entries=300`);
      const hist = await safeJSON(histRes);

      const entries = Array.isArray(hist?.entries) ? hist.entries : [];
      // filtra per timestamp (se assente, scartiamo)
      const recent = entries.filter((e) => typeof e?.timestamp === "number" && e.timestamp >= since);
      const sales = recent.length;

      if (sales >= minSales) {
        withVolumes.push({ ...it, sales });
      }
    } catch (e) {
      // non interrompiamo il batch per 1 item
      // eslint-disable-next-line no-console
      console.warn("Errore history Universalis per item", it.id, e);
    }
  }

  // ordina per volume decrescente
  withVolumes.sort((a, b) => b.sales - a.sales);

  cache = { key, data: withVolumes, ts: now };

  return NextResponse.json(withVolumes, {
    headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=3600" },
  });
}
