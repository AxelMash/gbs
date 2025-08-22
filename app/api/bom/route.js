// app/api/bom/route.js
// Query: ?id=<ITEM_ID>&scope=<DC|World>&metric=<lowest|average|p25>
// Risposta: ricetta, componenti (con nome, prezzo, e world di provenienza del prezzo), totali e profit/ROI.
// Cache: ricette 24h, prezzi 60s (impostati tramite fetch revalidate e Cache-Control)

const REVAL_RECIPE = 60 * 60 * 24; // 24h
const REVAL_MARKET = 60;           // 60s

const json = (obj, ttl = REVAL_MARKET) =>
  new Response(JSON.stringify(obj), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, s-maxage=${ttl}, stale-while-revalidate=300`,
    },
    status: 200,
  });

const safeJSON = async (resp) => {
  if (!resp || !resp.ok) return null;
  const text = await resp.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
};

const fetchItemName = async (id) => {
  try {
    const url = `https://xivapi.com/Item/${encodeURIComponent(id)}?columns=Name`;
    const resp = await fetch(url, {
      next: { revalidate: REVAL_RECIPE },
      headers: { "User-Agent": "Marketcraft/0.1 (+nextjs)" },
    });
    const data = await safeJSON(resp);
    return data?.Name || `Item #${id}`;
  } catch {
    return `Item #${id}`;
  }
};

const fetchMarket = async (scope, id) => {
  try {
    const url = `https://universalis.app/api/v2/${encodeURIComponent(scope)}/${encodeURIComponent(id)}`;
    const resp = await fetch(url, { next: { revalidate: REVAL_MARKET } });
    return await safeJSON(resp);
  } catch {
    return null;
  }
};

// Ritorna { unit, fromWorld } per lowest/p25 quando possibile; per average { unit, fromWorld: null }
const pickUnitPrice = (marketData, metric) => {
  if (!marketData) return { unit: null, fromWorld: null };

  if (metric === "average") {
    return { unit: marketData.averagePrice ?? null, fromWorld: null };
  }

  const listings = Array.isArray(marketData.listings) ? marketData.listings : [];

  if (metric === "lowest") {
    if (!listings.length) return { unit: marketData.averagePrice ?? null, fromWorld: null };
    let best = null;
    for (const l of listings) {
      if (typeof l?.pricePerUnit === "number") {
        if (best === null || l.pricePerUnit < best.pricePerUnit) best = l;
      }
    }
    return best
      ? { unit: best.pricePerUnit, fromWorld: best.worldName ?? null }
      : { unit: marketData.averagePrice ?? null, fromWorld: null };
  }

  if (metric === "p25") {
    if (!listings.length) return { unit: marketData.averagePrice ?? null, fromWorld: null };
    const arr = listings
      .filter((l) => typeof l?.pricePerUnit === "number" && isFinite(l.pricePerUnit))
      .sort((a, b) => a.pricePerUnit - b.pricePerUnit);
    if (!arr.length) return { unit: marketData.averagePrice ?? null, fromWorld: null };
    const idx = Math.max(0, Math.floor(0.25 * (arr.length - 1)));
    const chosen = arr[idx];
    return { unit: chosen?.pricePerUnit ?? marketData.averagePrice ?? null, fromWorld: chosen?.worldName ?? null };
  }

  return { unit: marketData.averagePrice ?? null, fromWorld: null };
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("id");
  const scope  = searchParams.get("scope") || "Chaos";
  const metric = (searchParams.get("metric") || "lowest").toLowerCase(); // lowest|average|p25

  if (!itemId) return json({ recipe: null, components: [], totals: null });

  // 1) Recipe (cache 24h)
  const recipeUrl =
    `https://xivapi.com/Recipe?` +
    `filters=ItemResultTargetID=${encodeURIComponent(itemId)}` +
    `&columns=ID,ItemResultTargetID,AmountResult,` +
    `AmountIngredient0,AmountIngredient1,AmountIngredient2,AmountIngredient3,AmountIngredient4,` +
    `AmountIngredient5,AmountIngredient6,AmountIngredient7,AmountIngredient8,AmountIngredient9,` +
    `ItemIngredient0TargetID,ItemIngredient1TargetID,ItemIngredient2TargetID,ItemIngredient3TargetID,ItemIngredient4TargetID,` +
    `ItemIngredient5TargetID,ItemIngredient6TargetID,ItemIngredient7TargetID,ItemIngredient8TargetID,ItemIngredient9TargetID` +
    `&limit=1`;

  let recipeData = null;
  try {
    const resp = await fetch(recipeUrl, {
      next: { revalidate: REVAL_RECIPE },
      headers: { "User-Agent": "Marketcraft/0.1 (+nextjs)" },
    });
    recipeData = await safeJSON(resp);
  } catch {}

  const recipeRow = recipeData?.Results?.[0] ?? null;
  if (!recipeRow) return json({ recipe: null, components: [], totals: null });

  const amountResult = Number(recipeRow.AmountResult ?? 1) || 1;

  // 2) Ingredienti
  const components = [];
  for (let i = 0; i < 10; i++) {
    const qty = Number(recipeRow[`AmountIngredient${i}`] ?? 0) || 0;
    const compId = Number(recipeRow[`ItemIngredient${i}TargetID`] ?? 0) || 0;
    if (qty > 0 && compId > 0) components.push({ id: compId, quantity: qty });
  }
  if (!components.length) return json({ recipe: { amountResult }, components: [], totals: null });

  // 3) Per componente: nome + prezzo + world origine prezzo
  const compData = await Promise.all(
    components.map(async (c) => {
      const [name, market] = await Promise.all([fetchItemName(c.id), fetchMarket(scope, c.id)]);
      const pick = pickUnitPrice(market, metric);
      const unitPrice = pick.unit ?? 0;
      return {
        id: c.id,
        name,
        quantity: c.quantity,
        unitPrice,
        total: unitPrice * c.quantity,
        priceWorld: pick.fromWorld, // <-- world da cui arriva il prezzo scelto (se disponibile)
      };
    })
  );

  // 4) Prezzo medio prodotto finale
  const finalMarket = await fetchMarket(scope, itemId);
  const unitMarketPrice = finalMarket?.averagePrice ?? null;

  // 5) Totali
  const materialCost = compData.reduce((acc, c) => acc + (c.total || 0), 0);
  const unitMaterialCost = materialCost / (amountResult || 1);
  const profitPerUnit = unitMarketPrice != null ? (unitMarketPrice - unitMaterialCost) : null;
  const roi = (unitMarketPrice != null && unitMaterialCost > 0)
    ? ((profitPerUnit / unitMaterialCost) * 100)
    : null;

  return json({
    recipe: { amountResult },
    components: compData,
    totals: {
      scope,
      metric,
      materialCost,
      unitMaterialCost,
      unitMarketPrice,
      profitPerUnit,
      roi,
    },
  });
}
