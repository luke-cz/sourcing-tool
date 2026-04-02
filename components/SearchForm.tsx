"use client";

import { useState, FormEvent } from "react";
import type { ParsedJD, SearchParams, SearchSettings, Source, TierCategory, TierLevel } from "@/lib/types";
import { TIER_CATEGORY_LABELS, DEFAULT_TIER_MAP } from "@/lib/tiers";

const ALL_SOURCES: { id: Source; label: string }[] = [
  { id: "github", label: "GitHub" },
  { id: "stackoverflow", label: "Stack Overflow" },
  { id: "linkedin", label: "LinkedIn" },
];

const ALL_CATEGORIES = Object.keys(DEFAULT_TIER_MAP) as TierCategory[];

const TIER_COLORS: Record<1 | 2, string> = {
  1: "bg-amber-50 border-amber-300 text-amber-800",
  2: "bg-slate-50 border-slate-300 text-slate-700",
};

// ─── Market Focus presets ────────────────────────────────────────────────────
type MarketId = "hft" | "defi" | "fintech" | "ai" | "bigtech";

interface MarketPreset {
  id: MarketId;
  label: string;
  icon: string;
  background: string;
  /** Which categories are active for this market */
  categories: TierCategory[];
  /** Override tier levels (categories not listed keep their default) */
  tierOverrides: Partial<Record<TierCategory, TierLevel>>;
}

const MARKET_PRESETS: MarketPreset[] = [
  {
    id: "hft",
    label: "HFT / Quant",
    icon: "📈",
    background: "High Frequency Trading / Quantitative Finance",
    categories: ["hft_quant", "faang", "big_tech", "top_ai"],
    tierOverrides: { hft_quant: 1, faang: 1, big_tech: 2, top_ai: 2 },
  },
  {
    id: "defi",
    label: "DeFi / Web3",
    icon: "⛓️",
    background: "DeFi / Web3 / Crypto",
    categories: ["web3", "top_ai", "faang", "strong_startups"],
    tierOverrides: { web3: 1, top_ai: 2, faang: 2, strong_startups: 2 },
  },
  {
    id: "fintech",
    label: "Fintech",
    icon: "💳",
    background: "Fintech / Payments",
    categories: ["top_fintech", "faang", "big_tech", "web3"],
    tierOverrides: { top_fintech: 1, faang: 1, big_tech: 2, web3: 2 },
  },
  {
    id: "ai",
    label: "AI / ML",
    icon: "🤖",
    background: "Artificial Intelligence / Machine Learning",
    categories: ["top_ai", "faang", "big_tech", "strong_startups"],
    tierOverrides: { top_ai: 1, faang: 1, big_tech: 2, strong_startups: 2 },
  },
  {
    id: "bigtech",
    label: "Big Tech",
    icon: "🏢",
    background: "Big Tech / Enterprise",
    categories: ["faang", "big_tech", "top_ai", "strong_startups"],
    tierOverrides: { faang: 1, big_tech: 1, top_ai: 2, strong_startups: 2 },
  },
];

/** Merge selected market presets → active categories + tier map */
function resolveMarketSettings(
  selectedMarkets: Set<MarketId>,
  baseMap: Record<TierCategory, TierLevel>
): Pick<SearchSettings, "tierCategories" | "tierMap"> {
  if (selectedMarkets.size === 0) {
    return { tierCategories: [...ALL_CATEGORIES], tierMap: { ...baseMap } };
  }
  const activePresets = MARKET_PRESETS.filter((m) => selectedMarkets.has(m.id));
  const categorySet = new Set<TierCategory>();
  activePresets.forEach((p) => p.categories.forEach((c) => categorySet.add(c)));

  // Merge tier overrides — if two markets disagree, take the lower (more generous) tier number
  const tierMap: Record<TierCategory, TierLevel> = { ...baseMap };
  for (const cat of Array.from(categorySet) as TierCategory[]) {
    let best: TierLevel = null;
    for (const preset of activePresets) {
      if (!preset.categories.includes(cat)) continue;
      const lvl = preset.tierOverrides[cat] ?? baseMap[cat];
      if (lvl !== null && (best === null || lvl < best)) best = lvl;
    }
    tierMap[cat] = best;
  }

  return { tierCategories: Array.from(categorySet) as TierCategory[], tierMap };
}

interface Props {
  onSearch: (params: SearchParams, parsedJD?: ParsedJD) => void;
  loading: boolean;
}

function defaultSettings(): SearchSettings {
  return {
    tierCategories: [...ALL_CATEGORIES],
    tierMap: { ...DEFAULT_TIER_MAP },
    minYears: null,
    location2: "",
  };
}

export function SearchForm({ onSearch, loading }: Props) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [language, setLanguage] = useState("");
  const [background, setBackground] = useState("");
  const [jobSpec, setJobSpec] = useState("");
  const [showJobSpec, setShowJobSpec] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sources, setSources] = useState<Set<Source>>(
    new Set(["github", "stackoverflow"] as Source[])
  );
  const [parsedJD, setParsedJD] = useState<ParsedJD | null>(null);
  const [parsingJD, setParsingJD] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SearchSettings>(defaultSettings());
  const [selectedMarkets, setSelectedMarkets] = useState<Set<MarketId>>(new Set());

  function toggleMarket(id: MarketId) {
    setSelectedMarkets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      // Recompute tier categories from the new selection
      const resolved = resolveMarketSettings(next, DEFAULT_TIER_MAP);
      setSettings((s) => ({ ...s, ...resolved }));
      // Auto-fill background from market labels when background is empty or was auto-set
      const labels = MARKET_PRESETS.filter((m) => next.has(m.id)).map((m) => m.background);
      if (labels.length > 0) {
        setBackground(labels.join(" · "));
      } else {
        setBackground("");
      }
      return next;
    });
  }

  function toggleSource(source: Source) {
    setSources((prev) => {
      const next = new Set(prev);
      if (next.has(source)) {
        if (next.size === 1) return prev;
        next.delete(source);
      } else {
        next.add(source);
      }
      return next;
    });
  }

  function toggleCategory(cat: TierCategory) {
    setSettings((prev) => {
      const has = prev.tierCategories.includes(cat);
      return {
        ...prev,
        tierCategories: has
          ? prev.tierCategories.filter((c) => c !== cat)
          : [...prev.tierCategories, cat],
      };
    });
  }

  function setTierLevel(cat: TierCategory, level: TierLevel) {
    setSettings((prev) => ({
      ...prev,
      tierMap: { ...prev.tierMap, [cat]: level },
    }));
  }

  function buildParams(overrideQuery?: string, overrideJD?: ParsedJD): SearchParams {
    const effectiveQuery = overrideQuery ?? query.trim() ?? parsedJD?.searchQuery ?? "";
    const jd = overrideJD ?? parsedJD;
    return {
      query: effectiveQuery,
      sources: Array.from(sources),
      location: location.trim() || undefined,
      location2: settings.location2.trim() || undefined,
      language: language.trim() || undefined,
      background: background.trim() || undefined,
      mustHaves: jd?.mustHaves,
      niceToHaves: jd?.niceToHaves,
      minYears: settings.minYears,
      settings,
    };
  }

  async function handleParseJD() {
    if (!jobSpec.trim()) return;
    setParsingJD(true);
    setParseError(null);
    setParsedJD(null);
    try {
      const res = await fetch("/api/parse-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobSpec, background }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to parse");
      const parsed = data as ParsedJD;
      setParsedJD(parsed);
      if (parsed.searchQuery) setQuery(parsed.searchQuery);
      onSearch(buildParams(parsed.searchQuery, parsed), parsed);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Failed to parse job spec");
    } finally {
      setParsingJD(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const effectiveQuery = query.trim() || parsedJD?.searchQuery || "";
    if (!effectiveQuery) return;
    onSearch(buildParams(effectiveQuery), parsedJD ?? undefined);
  }

  const canSearch = (query.trim() || parsedJD?.searchQuery) && !loading;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* ── Market Focus ─────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
            Market focus
          </span>
          {selectedMarkets.size === 0 && (
            <span className="text-xs text-gray-400">(all markets — select one or more to focus)</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {MARKET_PRESETS.map((market) => {
            const active = selectedMarkets.has(market.id);
            return (
              <button
                key={market.id}
                type="button"
                onClick={() => toggleMarket(market.id)}
                disabled={loading}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  active
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                <span>{market.icon}</span>
                {market.label}
              </button>
            );
          })}
          {selectedMarkets.size > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectedMarkets(new Set());
                setSettings((s) => ({ ...s, ...resolveMarketSettings(new Set(), DEFAULT_TIER_MAP) }));
                setBackground("");
              }}
              disabled={loading}
              className="px-3 py-1.5 rounded-full text-xs text-gray-400 border border-dashed border-gray-300 hover:border-gray-400 hover:text-gray-600 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Background */}
      <div className="flex gap-2 items-center">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
          Background
        </label>
        <input
          type="text"
          value={background}
          onChange={(e) => setBackground(e.target.value)}
          placeholder='e.g. "High Frequency Trading", "AI startup", "crypto exchange"'
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
      </div>

      {/* Job spec */}
      <div>
        <button
          type="button"
          onClick={() => setShowJobSpec((v) => !v)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
        >
          <span>{showJobSpec ? "▾" : "▸"}</span>
          {showJobSpec ? "Hide job spec" : "Paste job spec"}
        </button>

        {showJobSpec && (
          <div className="mt-2 space-y-2">
            <textarea
              value={jobSpec}
              onChange={(e) => setJobSpec(e.target.value)}
              placeholder="Paste the full job description here…"
              rows={6}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
              disabled={loading || parsingJD}
            />
            <button
              type="button"
              onClick={handleParseJD}
              disabled={!jobSpec.trim() || parsingJD || loading}
              className="px-4 py-1.5 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {parsingJD ? "Analyzing & searching…" : "Analyze & search"}
            </button>
            {parseError && <p className="text-xs text-red-600">{parseError}</p>}
          </div>
        )}
      </div>

      {/* Parsed JD chips */}
      {parsedJD && (
        <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div>
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Must haves</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {parsedJD.mustHaves.map((req) => (
                <span key={req} className="text-xs bg-blue-100 text-blue-800 border border-blue-200 rounded-full px-2.5 py-0.5 font-medium">
                  {req}
                </span>
              ))}
            </div>
          </div>
          {parsedJD.niceToHaves.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nice to have</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {parsedJD.niceToHaves.map((req) => (
                  <span key={req} className="text-xs bg-gray-100 text-gray-600 border border-gray-200 rounded-full px-2.5 py-0.5">
                    {req}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main search row */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={parsedJD ? parsedJD.searchQuery : 'e.g. "react developer" or "rust trading"'}
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!canSearch}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Searching…
            </span>
          ) : "Search"}
        </button>
      </div>

      {/* Sources + filters row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sources:</span>
          {ALL_SOURCES.map(({ id, label }) => (
            <label
              key={id}
              className={`flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                sources.has(id)
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <input type="checkbox" className="sr-only" checked={sources.has(id)} onChange={() => toggleSource(id)} disabled={loading} />
              {label}
            </label>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location 1"
            className="w-28 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <input
            type="text"
            value={settings.location2}
            onChange={(e) => setSettings((s) => ({ ...s, location2: e.target.value }))}
            placeholder="Location 2"
            className="w-28 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <input
            type="text"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="Language"
            className="w-28 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>
      </div>

      {/* Settings panel */}
      <div>
        <button
          type="button"
          onClick={() => setShowSettings((v) => !v)}
          className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1"
        >
          <span>{showSettings ? "▾" : "▸"}</span>
          Search settings
        </button>

        {showSettings && (
          <div className="mt-3 space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            {/* Years of experience */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                Min. years exp.
              </label>
              <div className="flex items-center gap-2">
                {[null, 2, 3, 5, 7, 10].map((yr) => (
                  <button
                    key={String(yr)}
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, minYears: yr }))}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      settings.minYears === yr
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {yr === null ? "Any" : `${yr}+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Tier groups */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Company tiers
                </p>
                {selectedMarkets.size > 0 && (
                  <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5">
                    Auto-configured by market focus
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {ALL_CATEGORIES.map((cat) => {
                  const active = settings.tierCategories.includes(cat);
                  const currentLevel = settings.tierMap[cat];
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      {/* Toggle group on/off */}
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`w-36 text-left px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          active
                            ? "bg-gray-800 text-white border-gray-800"
                            : "bg-white text-gray-400 border-gray-200"
                        }`}
                      >
                        {TIER_CATEGORY_LABELS[cat]}
                      </button>

                      {/* Tier level selector */}
                      {active && (
                        <div className="flex items-center gap-1">
                          {([1, 2] as TierLevel[]).map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setTierLevel(cat, lvl)}
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                                currentLevel === lvl
                                  ? TIER_COLORS[lvl as 1 | 2]
                                  : "bg-white border-gray-200 text-gray-400"
                              }`}
                            >
                              Tier {lvl}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
