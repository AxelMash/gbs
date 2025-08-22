"use client";

import { useEffect, useState } from "react";
import { useThemeClasses } from "../hooks/useThemeClasses";

export default function TopItemsPage() {
  const { T } = useThemeClasses();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState("Chaos");
  const [metric, setMetric] = useState("lowest");

  async function fetchTop() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/top-items?scope=${encodeURIComponent(scope)}&metric=${encodeURIComponent(
          metric
        )}&limit=20&days=7&minSales=10&sample=100`
      );
      const data = await res.json();
      setItems(data || []);
    } catch (e) {
      console.error("Errore fetch top-items:", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTop();
  }, [scope, metric]);

  return (
    <div className={T.bodyClass}>
      <h1 className="text-2xl font-bold text-indigo-400 flex items-center gap-2">
        📈 Top Opportunità Craft
      </h1>

      {/* Filtri */}
      <div className="flex flex-col md:flex-row gap-3 bg-gradient-to-br from-gray-900 to-gray-800 p-4 rounded-xl shadow">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-300">
            Scope (DC/World)
          </label>
          <input
            type="text"
            className="p-2 border rounded bg-gray-950 text-white"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-300">
            Metrica prezzi
          </label>
          <select
            className="p-2 border rounded bg-gray-950 text-white"
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
          >
            <option value="lowest">Prezzo minimo</option>
            <option value="average">Media</option>
            <option value="p25">25° percentile</option>
          </select>
        </div>

        <button
          className="self-end px-3 py-2 border rounded bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
          onClick={fetchTop}
          disabled={loading}
        >
          {loading ? "Carico…" : "Aggiorna"}
        </button>
      </div>

      {/* Tabella risultati */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow overflow-x-auto">
        <table className="min-w-full text-sm text-gray-200">
          <thead className="bg-gray-800 text-gray-300">
            <tr>
              <th className="p-2 text-left">Item</th>
              <th className="p-2 text-left">Vendite (7d)</th>
              <th className="p-2 text-left">Costo unitario</th>
              <th className="p-2 text-left">Prezzo mercato</th>
              <th className="p-2 text-left">Profitto</th>
              <th className="p-2 text-left">ROI</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr
                key={it.id}
                className={i % 2 === 0 ? "bg-gray-950/50" : "bg-gray-900/50"}
              >
                <td className="p-2">{it.name}</td>
                <td className="p-2">{it.sales}</td>
                <td className="p-2">
                  {it.unitCost?.toLocaleString()} gil
                </td>
                <td className="p-2">
                  {it.unitMarketPrice?.toLocaleString()} gil
                </td>
                <td
                  className={`p-2 ${
                    it.profitPerUnit > 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {it.profitPerUnit?.toLocaleString()} gil
                </td>
                <td
                  className={`p-2 ${
                    it.roi > 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {it.roi?.toFixed(1)}%
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr>
                <td
                  className="p-2 text-gray-500 text-center"
                  colSpan="6"
                >
                  Nessun risultato trovato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
