// app/api/item-search/route.js
const REVALIDATE_SECONDS = 60 * 60 * 24; // 24h

const json = (obj, ttl = REVALIDATE_SECONDS) =>
  new Response(JSON.stringify(obj), {
    headers: {
      "Content-Type": "application/json",
      // CDN/proxy: tieni 24h, consenti SWR di 6h
      "Cache-Control": `public, s-maxage=${ttl}, stale-while-revalidate=21600`,
    },
    status: 200,
  });

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();

  if (q.length < 3) return json([]);

  const buildUrl = (query) => {
    const qExpr = `Name~"${query}"`; // partial match ("iron" trova "Iron Ingot")
    return `https://v2.xivapi.com/api/search?sheets=Item&fields=Name&limit=10&query=${encodeURIComponent(qExpr)}`;
  };

  const fetchJSONSafe = async (url) => {
    try {
      const resp = await fetch(url, {
        // Next.js data cache con revalidate
        next: { revalidate: REVALIDATE_SECONDS },
        headers: { "User-Agent": "Marketcraft/0.1 (+nextjs)" },
      });
      if (!resp.ok) return null;
      const text = await resp.text();
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  };

  // 1) query così com'è
  let data = await fetchJSONSafe(buildUrl(q));
  let results = Array.isArray(data?.results) ? data.results : [];

  // 2) fallback lowercase
  if (!results.length) {
    data = await fetchJSONSafe(buildUrl(q.toLowerCase()));
    results = Array.isArray(data?.results) ? data.results : [];
  }

  const items = results.map((r) => ({ id: r.row_id, name: r.fields?.Name ?? "(no name)" }));
  return json(items);
}
