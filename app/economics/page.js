'use client';
import { useState } from 'react';

export default function Economics() {
  const [craftRes, setCraftRes] = useState(null);
  const [qualityRes, setQualityRes] = useState(null);
  const [arbRes, setArbRes] = useState(null);
  const [batchRes, setBatchRes] = useState(null);

  async function handleCraft(e) {
    e.preventDefault();
    const id = e.target.itemId.value;
    const r = await fetch(`/api/economics?type=craft&id=${id}`);
    setCraftRes(await r.json());
  }
  async function handleQuality(e) {
    e.preventDefault();
    const id = e.target.qitem.value;
    const r = await fetch(`/api/economics?type=quality&id=${id}`);
    setQualityRes(await r.json());
  }
  async function handleArb(e) {
    e.preventDefault();
    const id = e.target.aid.value;
    const dc = e.target.adc.value;
    const r = await fetch(`/api/economics?type=arbitrage&id=${id}&dc=${dc}`);
    setArbRes(await r.json());
  }
  async function handleBatch(e) {
    e.preventDefault();
    const items = e.target.items.value; // format id:qty,id:qty
    const r = await fetch(`/api/economics?type=batch&items=${encodeURIComponent(items)}`);
    setBatchRes(await r.json());
  }

  return (
    <div className="p-4 space-y-8">
      <section>
        <h1 className="text-2xl font-bold mb-2">Craft vs Buy</h1>
        <form onSubmit={handleCraft} className="space-x-2">
          <input name="itemId" placeholder="Item ID" className="border px-2 py-1" />
          <button className="border px-2 py-1" type="submit">Calcola</button>
        </form>
        {craftRes && <pre className="mt-2 bg-gray-100 p-2 text-xs overflow-x-auto">{JSON.stringify(craftRes,null,2)}</pre>}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-2">Quality score</h2>
        <form onSubmit={handleQuality} className="space-x-2">
          <input name="qitem" placeholder="Item ID" className="border px-2 py-1" />
          <button className="border px-2 py-1" type="submit">Calcola</button>
        </form>
        {qualityRes && <pre className="mt-2 bg-gray-100 p-2 text-xs overflow-x-auto">{JSON.stringify(qualityRes,null,2)}</pre>}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-2">Arbitraggio cross-world</h2>
        <form onSubmit={handleArb} className="space-x-2">
          <input name="aid" placeholder="Item ID" className="border px-2 py-1" />
          <input name="adc" placeholder="DC" defaultValue="Chaos" className="border px-2 py-1" />
          <button className="border px-2 py-1" type="submit">Calcola</button>
        </form>
        {arbRes && <pre className="mt-2 bg-gray-100 p-2 text-xs overflow-x-auto">{JSON.stringify(arbRes,null,2)}</pre>}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-2">Batch planner</h2>
        <form onSubmit={handleBatch} className="space-x-2">
          <input name="items" placeholder="id:qty,id:qty" className="border px-2 py-1" />
          <button className="border px-2 py-1" type="submit">Calcola</button>
        </form>
        {batchRes && <pre className="mt-2 bg-gray-100 p-2 text-xs overflow-x-auto">{JSON.stringify(batchRes,null,2)}</pre>}
      </section>
    </div>
  );
}
