"use client";

import { useEffect, useRef, useState } from "react";
import { DC_LIST, DC_TO_WORLDS } from "./ffxiv-realms";
import { useThemeClasses } from "./hooks/useThemeClasses";

/* ---------- THEMES ---------- */
const THEMES = {
  slate: {
    body: "min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100",
    header: "border-b border-slate-800/80 bg-slate-900/50 backdrop-blur",
    headerTitle: "text-xl font-semibold tracking-tight",
    headerBadge: "ml-2 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-300 ring-1 ring-emerald-400/20",
    subtext: "text-xs text-slate-400",
    card: "rounded-2xl border border-slate-800 bg-slate-900/50 p-4 shadow-xl shadow-black/20",
    input: "w-full rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500",
    select: "w-full rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500",
    label: "block text-sm font-medium text-slate-300 mb-1",
    list: "border border-slate-700 rounded-xl bg-slate-800 divide-y divide-slate-700",
    listItem: "p-2 hover:bg-slate-700 cursor-pointer",
    table: "w-full text-sm border border-slate-700 rounded-lg overflow-hidden",
    thead: "bg-slate-800/70",
    cell: "p-2 border border-slate-700",
    zebra: "[&>tr:nth-child(odd)]:bg-slate-800/40",
    brandBox: "h-9 w-9 rounded-xl bg-indigo-500/20 ring-1 ring-indigo-400/30 grid place-items-center",
    brandLetter: "text-indigo-300 font-bold",
    primaryBtn: "w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-50",
    ghostBtn: "rounded-xl border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800/50",
    muted: "text-slate-400",
    tiny: "text-xs text-slate-500",
    badgePos: "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-slate-800 border border-slate-700",
    badgeNeg: "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-rose-900/30 border border-rose-800 text-rose-200",
    badgeOk:  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-emerald-900/30 border border-emerald-800 text-emerald-200",
  },
  ffxiv: {
    body: "min-h-screen bg-gradient-to-b from-[#0b1120] to-[#101a2c] text-[#f1e5c7]",
    header: "border-b border-yellow-800/50 bg-[#141b2d]/70 backdrop-blur",
    headerTitle: "text-xl font-semibold tracking-tight text-yellow-200",
    headerBadge: "ml-2 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-300 ring-1 ring-emerald-400/20",
    subtext: "text-xs text-yellow-400",
    card: "rounded-2xl border border-yellow-700 bg-[#1a2238]/70 p-4 shadow-lg",
    input: "w-full rounded-xl border border-yellow-800 bg-[#0e1628] px-3 py-2 text-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500",
    select: "w-full rounded-xl border border-yellow-800 bg-[#0e1628] px-3 py-2 text-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500",
    label: "block text-sm font-medium text-yellow-300 mb-1",
    list: "border border-yellow-800 rounded-xl bg-[#0e1628] divide-y divide-yellow-800",
    listItem: "p-2 hover:bg-yellow-800/30 cursor-pointer",
    table: "w-full text-sm border border-yellow-800 rounded-lg overflow-hidden",
    thead: "bg-yellow-900/30",
    cell: "p-2 border border-yellow-800",
    zebra: "[&>tr:nth-child(odd)]:bg-yellow-900/10",
    brandBox: "h-9 w-9 rounded-xl bg-yellow-600/20 ring-1 ring-yellow-400/40 grid place-items-center",
    brandLetter: "text-yellow-300 font-bold",
    primaryBtn: "w-full rounded-xl bg-yellow-600 hover:bg-yellow-500 px-3 py-2 text-sm font-medium text-black disabled:opacity-50",
    ghostBtn: "rounded-xl border border-yellow-800 px-3 py-2 text-sm hover:bg-yellow-900/20",
    muted: "text-yellow-400",
    tiny: "text-xs text-yellow-400",
    badgePos: "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-emerald-900/30 border border-emerald-800 text-emerald-200",
    badgeNeg: "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-rose-900/30 border border-rose-800 text-rose-200",
    badgeOk:  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-yellow-900/40 border border-yellow-800",
  },
};

export default function Home() {
  /* ---------- Stato ---------- */
  const { theme, setTheme, T } = useThemeClasses();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  const [dc, setDc] = useState("Chaos");
  const [world, setWorld] = useState("ALL");
  const [metric, setMetric] = useState("lowest");

  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(false);

  const [bom, setBom] = useState(null);
  const [bomLoading, setBomLoading] = useState(false);

  const [refreshNonce, setRefreshNonce] = useState(0);
  const [lastPricesAt, setLastPricesAt] = useState(null);
  const [lastBomAt, setLastBomAt] = useState(null);

  const [favorites, setFavorites] = useState([]);      // [{id,name}]
  const [recents, setRecents] = useState([]);          // [{id,name,ts}]
  const [compare, setCompare] = useState([]);          // [{id,name}]
  const [compareData, setCompareData] = useState({});  // {id: {totals}}

  const searchAbortRef = useRef(null);
  const priceAbortRef = useRef(null);
  const debounceRef = useRef(null);

  /* ---------- Theme persistence ---------- */
  useEffect(() => {
    const savedTheme = localStorage.getItem("marketcraft:theme");
    if (savedTheme && THEMES[savedTheme]) setTheme(savedTheme);
    const fav = localStorage.getItem("marketcraft:favorites");
    if (fav) setFavorites(JSON.parse(fav));
    const rec = localStorage.getItem("marketcraft:recents");
    if (rec) setRecents(JSON.parse(rec));
    const cmp = localStorage.getItem("marketcraft:compare");
    if (cmp) setCompare(JSON.parse(cmp));
  }, []);
  useEffect(() => localStorage.setItem("marketcraft:theme", theme), [theme]);
  useEffect(() => localStorage.setItem("marketcraft:favorites", JSON.stringify(favorites)), [favorites]);
  useEffect(() => localStorage.setItem("marketcraft:recents", JSON.stringify(recents.slice(0, 10))), [recents]);
  useEffect(() => localStorage.setItem("marketcraft:compare", JSON.stringify(compare.slice(0, 8))), [compare]);

  /* ---------- Helpers ---------- */
  async function fetchJSON(url, signal) {
    const resp = await fetch(url, { signal });
    const text = await resp.text();
    return text ? JSON.parse(text) : null;
  }
  const scope = world !== "ALL" ? world : dc;
  const scopeLabel = world !== "ALL" ? world : `${dc} (tutti i world)`;

  const addRecent = (item) => {
    setRecents((prev) => {
      const filtered = prev.filter((r) => r.id !== item.id);
      return [{ ...item, ts: Date.now() }, ...filtered].slice(0, 10);
    });
  };
  const toggleFavorite = (item) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === item.id);
      return exists ? prev.filter((f) => f.id !== item.id) : [{ id: item.id, name: item.name }, ...prev].slice(0, 50);
    });
  };
  const inFavorites = (item) => favorites.some((f) => f.id === item?.id);
  const addToCompare = (item) => {
    setCompare((prev) => {
      if (prev.some((c) => c.id === item.id)) return prev;
      return [...prev, { id: item.id, name: item.name }].slice(0, 8);
    });
  };
  const removeFromCompare = (id) => {
    setCompare((prev) => prev.filter((c) => c.id !== id));
    setCompareData((prev) => {
      const clone = { ...prev };
      delete clone[id];
      return clone;
    });
  };

  /* ---------- Search ---------- */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        if (searchAbortRef.current) searchAbortRef.current.abort();
        const controller = new AbortController();
        searchAbortRef.current = controller;
        const data = await fetchJSON(`/api/item-search?q=${encodeURIComponent(query)}`, controller.signal);
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  /* ---------- Prices ---------- */
  useEffect(() => {
    if (!selectedItem) {
      setPrices(null); setBom(null);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        if (priceAbortRef.current) priceAbortRef.current.abort();
        const controller = new AbortController();
        priceAbortRef.current = controller;
        const data = await fetchJSON(
          `/api/universalis?id=${selectedItem.id}&scope=${encodeURIComponent(scope)}&nocache=${refreshNonce}`,
          controller.signal
        );
        setPrices(data || { listings: [], averagePrice: null });
        setLastPricesAt(Date.now());
      } catch {
        setPrices({ listings: [], averagePrice: null });
        setLastPricesAt(Date.now());
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedItem, dc, world, refreshNonce]);

  /* ---------- BOM ---------- */
  useEffect(() => {
    if (!selectedItem) { setBom(null); return; }
    (async () => {
      try {
        setBomLoading(true);
        const data = await fetchJSON(
          `/api/bom?id=${selectedItem.id}&scope=${encodeURIComponent(scope)}&metric=${encodeURIComponent(metric)}&nocache=${refreshNonce}`
        );
        setBom(data);
        setLastBomAt(Date.now());
      } catch {
        setBom(null);
        setLastBomAt(Date.now());
      } finally {
        setBomLoading(false);
      }
    })();
  }, [selectedItem, dc, world, metric, refreshNonce]);

  /* ---------- Compare data fetch (per ogni item in lista) ---------- */
  useEffect(() => {
    if (compare.length === 0) return;
    (async () => {
      const scopeQ = encodeURIComponent(scope);
      const metricQ = encodeURIComponent(metric);
      const urls = compare.map((it) => [`${it.id}`, `/api/bom?id=${it.id}&scope=${scopeQ}&metric=${metricQ}&nocache=${refreshNonce}`]);
      const results = await Promise.all(
        urls.map(async ([id, url]) => {
          try {
            const data = await fetchJSON(url);
            return [id, data?.totals || null];
          } catch {
            return [id, null];
          }
        })
      );
      const map = {};
      for (const [id, totals] of results) map[id] = totals;
      setCompareData(map);
    })();
  }, [compare, scope, metric, refreshNonce]);

  /* ---------- Render ---------- */
  return (
    <div className={T.bodyClass}>
      {/* Topbar */}
      <header className={T.header}>
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={T.brandBox}><span className={T.brandLetter}>M</span></div>
            <h1 className={T.headerTitle}>Marketcraft</h1>
            <span className={T.headerBadge}>MVP</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={T.subtext}>Tema</span>
            <button className={T.primaryBtn + " !w-auto px-3 py-1.5"} onClick={() => setTheme(t => t === "slate" ? "ffxiv" : "slate")}>
              {theme === "slate" ? "🜲 FFXIV" : "🌙 Slate"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Controls */}
        <section className={T.card}>
          <div className="grid gap-4 md:grid-cols-5">
            <SelectBox label="Data Center" value={dc} onChange={(v) => { setDc(v); setWorld("ALL"); }} options={DC_LIST} T={T} />
            <SelectBox
              label="World"
              value={world}
              onChange={setWorld}
              options={["ALL", ...(DC_TO_WORLDS[dc] || [])]}
              labels={{ ALL: `Tutti (${dc})` }}
              T={T}
            />
            <SelectBox
              label="Metrica prezzi"
              value={metric}
              onChange={setMetric}
              options={["lowest", "average", "p25"]}
              labels={{ lowest: "Prezzo minimo", average: "Media", p25: "25° percentile" }}
              T={T}
            />
            <div className="flex items-end gap-2">
              <button
                className={T.primaryBtn}
                onClick={() => setRefreshNonce((n) => n + 1)}
                disabled={loading || bomLoading}
                title="Forza refresh"
              >
                {loading || bomLoading ? "Aggiorno…" : "Aggiorna ora"}
              </button>
              {selectedItem && (
                <button
                  className={T.ghostBtn}
                  onClick={() => addToCompare(selectedItem)}
                  title="Aggiungi al confronto"
                >
                  ➕ Confronta
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Colonna sinistra: Preferiti */}
          <section className={T.card + " md:col-span-1"}>
            <h2 className="text-lg font-semibold mb-2">⭐ Preferiti</h2>
            {favorites.length === 0 ? (
              <p className={T.muted}>Nessun preferito. Aggiungi con la ⭐ accanto all&apos;item.</p>
            ) : (
              <ul className={T.list}>
                {favorites.map((f) => (
                  <li key={f.id} className={T.listItem + " flex items-center justify-between"}>
                    <button onClick={() => { setSelectedItem(f); addRecent(f); }} className="text-left flex-1">{f.name}</button>
                    <button onClick={() => toggleFavorite(f)} className="opacity-80 hover:opacity-100" title="Rimuovi">⭐</button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Colonna centrale: Search + Recenti */}
          <section className={T.card + " md:col-span-2"}>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                placeholder="Cerca un item (min 3 lettere)…"
                className={T.input + " flex-1"}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {selectedItem && (
                <button
                  className={T.ghostBtn}
                  onClick={() => toggleFavorite(selectedItem)}
                  title={inFavorites(selectedItem) ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
                >
                  {inFavorites(selectedItem) ? "⭐" : "☆"}
                </button>
              )}
            </div>

            {results.length > 0 ? (
              <ul className={T.list}>
                {results.map((item) => (
                  <li
                    key={item.id}
                    className={T.listItem + " flex items-center justify-between"}
                    onClick={() => { setSelectedItem(item); setResults([]); setQuery(item.name); addRecent(item); }}
                  >
                    <span>{item.name}</span>
                    <button
                      className="opacity-70 hover:opacity-100"
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(item); }}
                      title="Aggiungi/rimuovi dai preferiti"
                    >
                      {favorites.some((f) => f.id === item.id) ? "⭐" : "☆"}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              query.trim().length >= 3 && <div className={T.muted + " text-sm"}>Nessun risultato.</div>
            )}

            {/* Recenti */}
            <div className="mt-4">
              <h3 className="font-medium mb-1">🕘 Cercati di recente</h3>
              {recents.length === 0 ? (
                <p className={T.tiny}>Nessuna ricerca recente.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {recents.slice(0, 10).map((r) => (
                    <button
                      key={r.id}
                      className={T.ghostBtn + " text-xs"}
                      onClick={() => { setSelectedItem(r); setQuery(r.name); }}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Prezzi */}
        {selectedItem && (
          <section className={T.card}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Prezzi — {selectedItem.name} — {scopeLabel}</h2>
              <span className={T.tiny}>Ultimo aggiornamento: {formatTime(lastPricesAt)}</span>
            </div>

            {loading ? (
              <p className={T.muted}>Caricamento prezzi…</p>
            ) : prices ? (
              <>
                <p className="mb-1 text-sm">
                  Prezzo medio: {prices?.averagePrice != null ? `${Math.round(prices.averagePrice).toLocaleString()} gil` : "–"}
                </p>
                <table className={T.table + " mt-3"}>
                  <thead className={T.thead}>
                    <tr>
                      <th className={T.cell}>Quantità</th>
                      <th className={T.cell}>Prezzo</th>
                      <th className={T.cell}>World</th> {/* WORLD ORIGINE LISTING */}
                    </tr>
                  </thead>
                  <tbody className={T.zebra}>
                    {(prices.listings ?? []).slice(0, 7).map((l, i) => (
                      <tr key={i}>
                        <td className={T.cell}>{l.quantity}</td>
                        <td className={T.cell}>{l.pricePerUnit.toLocaleString()} gil</td>
                        <td className={T.cell}>{l.worldName ?? "—"}</td>
                      </tr>
                    ))}
                    {(!prices.listings || prices.listings.length === 0) && (
                      <tr><td className={T.cell} colSpan="3">Nessuna listing disponibile.</td></tr>
                    )}
                  </tbody>
                </table>
              </>
            ) : null}
          </section>
        )}

        {/* BOM */}
        {selectedItem && (
          <section className={T.card}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Craft Planner — {selectedItem.name}</h2>
              <span className={T.tiny}>Ultimo aggiornamento: {formatTime(lastBomAt)}</span>
            </div>

            {bomLoading ? (
              <p className={T.muted}>Calcolo BOM…</p>
            ) : bom ? (
              <>
                {bom.components.length === 0 ? (
                  <p className={T.muted}>Nessuna ricetta trovata per questo item.</p>
                ) : (
                  <>
                    <p className="mb-2 text-sm">
                      Output per craft: <b>{bom.recipe?.amountResult ?? 1}</b> — Metrica: <b>{labelMetric(bom.totals.metric)}</b>
                    </p>
                    <table className={T.table + " mb-3"}>
                      <thead className={T.thead}>
                        <tr>
                          <th className={T.cell}>Materiale</th>
                          <th className={T.cell}>Quantità</th>
                          <th className={T.cell}>Unit Price</th>
                          <th className={T.cell}>Totale</th>
                          <th className={T.cell}>World prezzo</th> {/* WORLD ORIGINE PREZZO */}
                        </tr>
                      </thead>
                      <tbody className={T.zebra}>
                        {bom.components.map((c, i) => (
                          <tr key={i}>
                            <td className={T.cell}>{c.name}</td>
                            <td className={T.cell}>{c.quantity}</td>
                            <td className={T.cell}>{c.unitPrice != null ? `${Math.round(c.unitPrice).toLocaleString()} gil` : "–"}</td>
                            <td className={T.cell}>{c.total != null ? `${Math.round(c.total).toLocaleString()} gil` : "–"}</td>
                            <td className={T.cell}>{c.priceWorld ?? (bom.totals.metric === "average" ? "Media DC/World" : "—")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="text-sm space-y-1">
                      <div>Scope: <b>{bom.totals.scope}</b></div>
                      <div>Costo materiali (batch): <b>{Math.round(bom.totals.materialCost).toLocaleString()} gil</b></div>
                      <div>Costo per 1 pezzo: <b>{Math.round(bom.totals.unitMaterialCost).toLocaleString()} gil</b></div>
                      <div>Prezzo mercato (1 pezzo): <b>{bom.totals.unitMarketPrice != null ? Math.round(bom.totals.unitMarketPrice).toLocaleString() : "–"} gil</b></div>
                      <div>Profitto per pezzo:{" "}
                        <b className={bom.totals.profitPerUnit > 0 ? T.badgeOk : bom.totals.profitPerUnit < 0 ? T.badgeNeg : T.badgePos}>
                          {bom.totals.profitPerUnit != null ? Math.round(bom.totals.profitPerUnit).toLocaleString() : "–"} gil
                        </b>
                      </div>
                      <div>ROI:{" "}
                        <b className={bom.totals.roi > 0 ? T.badgeOk : bom.totals.roi < 0 ? T.badgeNeg : T.badgePos}>
                          {bom.totals.roi != null ? `${bom.totals.roi.toFixed(1)}%` : "–"}
                        </b>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : null}
          </section>
        )}

        {/* Confronto multiplo */}
        {compare.length > 0 && (
          <section className={T.card}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Confronto (scope: {scopeLabel}, metrica: {labelMetric(metric)})</h2>
              <div className="flex gap-2">
                <button className={T.ghostBtn} onClick={() => setCompare([])}>Svuota</button>
                <button className={T.primaryBtn + " !w-auto"} onClick={() => setRefreshNonce(n=>n+1)} title="Refresh dati confronto">Aggiorna</button>
              </div>
            </div>
            <table className={T.table + " mt-3"}>
              <thead className={T.thead}>
                <tr>
                  <th className={T.cell}>Item</th>
                  <th className={T.cell}>Costo unit.</th>
                  <th className={T.cell}>Prezzo unit.</th>
                  <th className={T.cell}>Profitto</th>
                  <th className={T.cell}>ROI</th>
                  <th className={T.cell}></th>
                </tr>
              </thead>
              <tbody className={T.zebra}>
                {compare.map((it) => {
                  const t = compareData[it.id];
                  return (
                    <tr key={it.id}>
                      <td className={T.cell}>{it.name}</td>
                      <td className={T.cell}>{t?.unitMaterialCost != null ? Math.round(t.unitMaterialCost).toLocaleString() : "–"} gil</td>
                      <td className={T.cell}>{t?.unitMarketPrice != null ? Math.round(t.unitMarketPrice).toLocaleString() : "–"} gil</td>
                      <td className={T.cell}>
                        {t?.profitPerUnit != null ? (
                          <span className={t.profitPerUnit > 0 ? T.badgeOk : t.profitPerUnit < 0 ? T.badgeNeg : T.badgePos}>
                            {Math.round(t.profitPerUnit).toLocaleString()} gil
                          </span>
                        ) : "–"}
                      </td>
                      <td className={T.cell}>
                        {t?.roi != null ? (
                          <span className={t.roi > 0 ? T.badgeOk : t.roi < 0 ? T.badgeNeg : T.badgePos}>
                            {t.roi.toFixed(1)}%
                          </span>
                        ) : "–"}
                      </td>
                      <td className={T.cell}>
                        <button className={T.ghostBtn} onClick={() => removeFromCompare(it.id)}>Rimuovi</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  );
}

/* ---------- Riutilizzabili ---------- */
function DataCard({ title, updated, loading, children, T }) {
  return (
    <section className={T.card}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className={T.tiny}>Ultimo aggiornamento: {formatTime(updated)}</span>
      </div>
      {loading ? <p className={T.muted}>Caricamento…</p> : children}
    </section>
  );
}
function SelectBox({ label, value, onChange, options, labels, T }) {
  return (
    <div>
      <label className={T.label}>{label}</label>
      <select className={T.select} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {labels?.[opt] || opt}
          </option>
        ))}
      </select>
    </div>
  );
}
function formatTime(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function labelMetric(m) {
  return { lowest: "Prezzo minimo", average: "Media", p25: "25° percentile" }[m] || m;
}
