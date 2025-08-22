
// Simple helper to fetch JSON safely
async function fetchJSON(url, options={}) {
  try {
    const resp = await fetch(url, options);
    const text = await resp.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

const REVAL_RECIPE = 60 * 60 * 24; // 24h
const REVAL_MARKET = 60;           // 60s

async function fetchRecipe(itemId) {
  const recipeUrl =
    `https://xivapi.com/Recipe?` +
    `filters=ItemResultTargetID=${encodeURIComponent(itemId)}` +
    `&columns=ID,AmountResult,` +
    `AmountIngredient0,AmountIngredient1,AmountIngredient2,AmountIngredient3,AmountIngredient4,` +
    `AmountIngredient5,AmountIngredient6,AmountIngredient7,AmountIngredient8,AmountIngredient9,` +
    `ItemIngredient0TargetID,ItemIngredient1TargetID,ItemIngredient2TargetID,ItemIngredient3TargetID,ItemIngredient4TargetID,` +
    `ItemIngredient5TargetID,ItemIngredient6TargetID,ItemIngredient7TargetID,ItemIngredient8TargetID,ItemIngredient9TargetID` +
    `&limit=1`;
  const data = await fetchJSON(recipeUrl, { headers: { 'User-Agent': 'Marketcraft/0.1 (+nextjs)' } });
  const row = data?.Results?.[0];
  if (!row) return null;
  const amountResult = Number(row.AmountResult ?? 1) || 1;
  const components = [];
  for (let i = 0; i < 10; i++) {
    const qty = Number(row[`AmountIngredient${i}`] ?? 0) || 0;
    const compId = Number(row[`ItemIngredient${i}TargetID`] ?? 0) || 0;
    if (qty > 0 && compId > 0) components.push({ id: compId, quantity: qty });
  }
  return { amountResult, components };
}

async function fetchMarket(scope, id) {
  const url = `https://universalis.app/api/v2/${encodeURIComponent(scope)}/${encodeURIComponent(id)}`;
  return await fetchJSON(url);
}

// pickUnitPrice similar to bom route
function pickUnitPrice(marketData, metric) {
  if (!marketData) return { unit: null, fromWorld: null };
  if (metric === 'average') return { unit: marketData.averagePrice ?? null, fromWorld: null };
  const listings = Array.isArray(marketData.listings) ? marketData.listings : [];
  if (!listings.length) return { unit: marketData.averagePrice ?? null, fromWorld: null };
  if (metric === 'lowest') {
    let best = null;
    for (const l of listings) {
      if (typeof l?.pricePerUnit === 'number') {
        if (best === null || l.pricePerUnit < best.pricePerUnit) best = l;
      }
    }
    return best ? { unit: best.pricePerUnit, fromWorld: best.worldName ?? null } : { unit: marketData.averagePrice ?? null, fromWorld: null };
  }
  if (metric === 'p25') {
    const arr = listings
      .filter(l => typeof l?.pricePerUnit === 'number' && isFinite(l.pricePerUnit))
      .sort((a,b) => a.pricePerUnit - b.pricePerUnit);
    if (!arr.length) return { unit: marketData.averagePrice ?? null, fromWorld: null };
    const idx = Math.max(0, Math.floor(0.25 * (arr.length - 1)));
    const chosen = arr[idx];
    return { unit: chosen?.pricePerUnit ?? marketData.averagePrice ?? null, fromWorld: chosen?.worldName ?? null };
  }
  return { unit: marketData.averagePrice ?? null, fromWorld: null };
}

// --- Craft vs Buy recursion ---
export async function craftVsBuy(id, scope='Chaos', metric='lowest', opts={}, memo={}) {
  if (memo[id]) return memo[id];
  const recipe = await fetchRecipe(id);
  const market = await fetchMarket(scope, id);
  const buyPrice = pickUnitPrice(market, metric).unit ?? Infinity;
  if (!recipe) {
    const res = { cost: buyPrice, method: 'buy', components: [] };
    memo[id] = res;
    return res;
  }
  let craftCost = 0;
  const compDetails = [];
  for (const c of recipe.components) {
    const res = await craftVsBuy(c.id, scope, metric, opts, memo);
    const total = res.cost * c.quantity;
    craftCost += total;
    compDetails.push({ id: c.id, quantity: c.quantity, cost: res.cost, total, method: res.method });
  }
  craftCost = craftCost / recipe.amountResult;
  const result = buyPrice <= craftCost
    ? { cost: buyPrice, method: 'buy', components: [] }
    : { cost: craftCost, method: 'craft', components: compDetails, amount: recipe.amountResult };
  memo[id] = result;
  return result;
}

// --- Quality metrics ---
export function computeQuality(marketData) {
  const listings = Array.isArray(marketData?.listings) ? marketData.listings : [];
  const history = Array.isArray(marketData?.recentHistory) ? marketData.recentHistory : [];
  const now = Date.now();
  // vendite/giorno
  let salesPerDay = 0;
  if (history.length) {
    const first = history[history.length - 1]?.timestamp ?? now;
    const days = Math.max(1, (now * 1000 - first) / (1000*60*60*24));
    salesPerDay = history.length / days;
  }
  // trend 7->14 giorni
  const last7 = history.filter(h => (now - h.timestamp/1000) <= 7*24*3600);
  const prev7 = history.filter(h => (now - h.timestamp/1000) > 7*24*3600 && (now - h.timestamp/1000) <= 14*24*3600);
  const avg = arr => arr.reduce((a,b)=>a+b,0)/ (arr.length||1);
  const avgLast7 = avg(last7.map(h=>h.pricePerUnit));
  const avgPrev7 = avg(prev7.map(h=>h.pricePerUnit));
  const trend = avgPrev7 ? ((avgLast7 - avgPrev7) / avgPrev7) * 100 : 0;
  // deviazione standard
  const mean = avg(history.map(h=>h.pricePerUnit));
  const variance = avg(history.map(h=>Math.pow(h.pricePerUnit-mean,2)));
  const stddev = Math.sqrt(variance);
  // bid-ask spread p25-p75
  const arr = listings
    .filter(l => typeof l?.pricePerUnit === 'number')
    .map(l => l.pricePerUnit)
    .sort((a,b)=>a-b);
  const p = (a, q) => a[Math.max(0, Math.floor(q*(a.length-1)))] ?? null;
  const spread = (p(arr,0.75) ?? 0) - (p(arr,0.25) ?? 0);
  return { salesPerDay, trend, stddev, spread };
}

// --- Cross world arbitrage ---
export function computeArbitrage(marketData) {
  const listings = Array.isArray(marketData?.listings) ? marketData.listings : [];
  const byWorld = {};
  for (const l of listings) {
    if (typeof l?.pricePerUnit !== 'number') continue;
    const w = l.worldName || 'UNKNOWN';
    if (!byWorld[w] || l.pricePerUnit < byWorld[w]) byWorld[w] = l.pricePerUnit;
  }
  let minWorld = null, maxWorld = null;
  for (const [w, p] of Object.entries(byWorld)) {
    if (!minWorld || p < minWorld.price) minWorld = { world: w, price: p };
    if (!maxWorld || p > maxWorld.price) maxWorld = { world: w, price: p };
  }
  const spread = (maxWorld && minWorld) ? ((maxWorld.price - minWorld.price) / minWorld.price) * 100 : 0;
  return { minWorld, maxWorld, spread };
}

// --- Batch planner ---
export async function batchMaterials(items, scope='Chaos', metric='lowest') {
  const totals = {};
  const breakdown = {};
  for (const it of items) {
    const res = await craftVsBuy(it.id, scope, metric);
    breakdown[it.id] = res;
    const collect = (node, qty) => {
      if (node.method === 'buy' || !node.components?.length) {
        totals[node.id || it.id] = (totals[node.id || it.id] || 0) + qty;
        return;
      }
      for (const c of node.components) {
        collect(c, qty * c.quantity);
      }
    };
    collect({ ...res, id: it.id }, it.quantity || 1);
  }
  return { totals, breakdown };
}

export { fetchRecipe, fetchMarket };
