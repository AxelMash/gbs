import { craftVsBuy, computeQuality, computeArbitrage, batchMaterials, fetchMarket } from '@/lib/economics';

const json = (obj, ttl = 60) =>
  new Response(JSON.stringify(obj), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `public, s-maxage=${ttl}, stale-while-revalidate=300`,
    },
    status: 200,
  });

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'craft';
  try {
    if (type === 'craft') {
      const id = searchParams.get('id');
      const scope = searchParams.get('scope') || 'Chaos';
      const metric = searchParams.get('metric') || 'lowest';
      const res = await craftVsBuy(id, scope, metric);
      return json(res);
    }
    if (type === 'quality') {
      const id = searchParams.get('id');
      const scope = searchParams.get('scope') || 'Chaos';
      const market = await fetchMarket(scope, id);
      const res = computeQuality(market);
      return json(res);
    }
    if (type === 'arbitrage') {
      const id = searchParams.get('id');
      const dc = searchParams.get('dc') || 'Chaos';
      const market = await fetchMarket(dc, id); // scope as DC will give all worlds
      const res = computeArbitrage(market);
      return json(res);
    }
    if (type === 'batch') {
      const itemsParam = searchParams.get('items');
      const scope = searchParams.get('scope') || 'Chaos';
      const metric = searchParams.get('metric') || 'lowest';
      const items = (itemsParam || '').split(',').map(p => {
        const [id, qty] = p.split(':');
        return { id, quantity: Number(qty || '1') };
      }).filter(x => x.id);
      const res = await batchMaterials(items, scope, metric);
      return json(res);
    }
    return json({ error: 'unknown type' }, 1);
  } catch (e) {
    return json({ error: e.message || 'error' }, 1);
  }
}
