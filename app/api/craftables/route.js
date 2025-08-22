import { NextResponse } from "next/server";

/**
 * Estrae la lista completa degli item craftabili (item risultanti da ricette) da XIVAPI.
 * - Paginazione gestita (page=1..n)
 * - Cache in memoria 24h
 * - Parametri facoltativi:
 *    ?maxPages=NUM   → limita quante pagine leggere (es. 10)
 */
let cache = { data: null, ts: 0 };
const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(req) {
  const now = Date.now();
  const url = new URL(req.url);
  const maxPages = Math.max(1, parseInt(url.searchParams.get("maxPages") || "100", 10)); // di default proviamo “molto”
  const useCache = cache.data && (now - cache.ts) < DAY_MS;

  if (useCache) {
    return NextResponse.json(cache.data, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=21600" },
    });
  }

  // helper: fetch + safe JSON
  const fetchJSON = async (endpoint) => {
    try {
      const resp = await fetch(endpoint, {
        // Revalidate lato Next per alleggerire se ci ripassiamo
        next: { revalidate: 86400 },
        headers: { "User-Agent": "Marketcraft/0.1 (+nextjs)" },
      });
      const text = await resp.text();
      try {
        return text ? JSON.parse(text) : null;
      } catch {
        console.error("XIVAPI non ha restituito JSON valido per:", endpoint, "body:", text?.slice(0, 200));
        return null;
      }
    } catch (e) {
      console.error("Errore rete XIVAPI:", endpoint, e);
      return null;
    }
  };

  // ⚠️ End-point corretto: "Recipe" (case-sensitive in alcuni proxy)
  const base = "https://xivapi.com/Recipe?columns=ID,ItemResult.ID,ItemResult.Name";

  let page = 1;
  let all = [];
  for (; page <= maxPages; page++) {
    const data = await fetchJSON(`${base}&page=${page}`);
    if (!data || !Array.isArray(data.Results)) break;

    const mapped = data.Results
      .map((r) => ({
        id: r?.ItemResult?.ID ?? null,
        name: r?.ItemResult?.Name ?? null,
        recipeId: r?.ID ?? null,
      }))
      .filter((x) => x.id && x.name);

    all = all.concat(mapped);

    const hasNext = data?.Pagination?.PageNext != null;
    if (!hasNext) break;
  }

  // dedup per item id
  const seen = new Set();
  const craftables = [];
  for (const it of all) {
    if (!seen.has(it.id)) {
      seen.add(it.id);
      craftables.push(it);
    }
  }

  cache = { data: craftables, ts: now };

  return NextResponse.json(craftables, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=21600" },
  });
}
