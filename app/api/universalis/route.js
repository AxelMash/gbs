// app/api/universalis/route.js
const REVALIDATE_SECONDS = 60; // 1 minuto

const json = (obj, ttl = REVALIDATE_SECONDS) =>
  new Response(JSON.stringify(obj), {
    headers: {
      "Content-Type": "application/json",
      // breve cache + SWR 5 min
      "Cache-Control": `public, s-maxage=${ttl}, stale-while-revalidate=300`,
    },
    status: 200,
  });

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const scope = searchParams.get("scope") || "Chaos";

  if (!id) return json({ listings: [], averagePrice: null });

  try {
    const url = `https://universalis.app/api/v2/${encodeURIComponent(scope)}/${encodeURIComponent(id)}`;
    const resp = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!resp.ok) return json({ listings: [], averagePrice: null });

    const text = await resp.text();
    const data = text ? JSON.parse(text) : { listings: [], averagePrice: null };
    return json(data);
  } catch {
    return json({ listings: [], averagePrice: null });
  }
}
