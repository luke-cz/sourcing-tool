"use client";

import { useState, FormEvent, KeyboardEvent } from "react";
import type { LocationConfig, ParsedJD, SearchParams, SearchSettings, Source, TierCategory, TierLevel, WorldRegion } from "@/lib/types";
import { TIER_CATEGORY_LABELS, DEFAULT_TIER_MAP } from "@/lib/tiers";

// ─── Region config ────────────────────────────────────────────────────────────
const REGIONS: { id: WorldRegion; label: string; icon: string }[] = [
  { id: "global",        label: "Global",        icon: "🌐" },
  { id: "north_america", label: "North America",  icon: "🌎" },
  { id: "south_america", label: "South America",  icon: "🌎" },
  { id: "europe",        label: "Europe",         icon: "🌍" },
  { id: "asia_pacific",  label: "Asia Pacific",   icon: "🌏" },
  { id: "middle_east",   label: "Middle East",    icon: "🌍" },
  { id: "africa",        label: "Africa",         icon: "🌍" },
];

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
    categories: ["hft_quant", "crypto_hft", "faang", "big_tech", "top_ai"],
    tierOverrides: { hft_quant: 1, crypto_hft: 1, faang: 1, big_tech: 2, top_ai: 2 },
  },
  {
    id: "defi",
    label: "DeFi / Web3",
    icon: "⛓️",
    background: "DeFi / Web3 / Crypto",
    categories: ["web3", "crypto_hft", "top_ai", "faang", "strong_startups"],
    tierOverrides: { web3: 1, crypto_hft: 1, top_ai: 2, faang: 2, strong_startups: 2 },
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

function defaultLocationConfig(): LocationConfig {
  return { regions: [], countries: [], cities: [] };
}

function defaultSettings(): SearchSettings {
  return {
    tierCategories: [...ALL_CATEGORIES],
    tierMap: { ...DEFAULT_TIER_MAP },
    minYears: null,
    locationConfig: defaultLocationConfig(),
  };
}

export function SearchForm({ onSearch, loading }: Props) {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("");
  const [countryInput, setCountryInput] = useState("");
  const [cityInput, setCityInput] = useState("");
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
      language: language.trim() || undefined,
      background: background.trim() || undefined,
      mustHaves: jd?.mustHaves,
      niceToHaves: jd?.niceToHaves,
      minYears: settings.minYears,
      settings,
    };
  }

  // ── Tag-input helpers ──────────────────────────────────────────────────
  function addTag(field: "countries" | "cities", value: string) {
    const v = value.trim();
    if (!v) return;
    setSettings((s) => {
      const existing = s.locationConfig[field];
      if (existing.includes(v)) return s;
      return { ...s, locationConfig: { ...s.locationConfig, [field]: [...existing, v] } };
    });
  }

  function removeTag(field: "countries" | "cities", value: string) {
    setSettings((s) => ({
      ...s,
      locationConfig: {
        ...s.locationConfig,
        [field]: s.locationConfig[field].filter((x) => x !== value),
      },
    }));
  }

  function handleTagKey(
    e: KeyboardEvent<HTMLInputElement>,
    field: "countries" | "cities",
    inputValue: string,
    setInput: (v: string) => void
  ) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(field, inputValue);
      setInput("");
    } else if (e.key === "Backspace" && !inputValue) {
      const list = settings.locationConfig[field];
      if (list.length > 0) removeTag(field, list[list.length - 1]);
    }
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
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">
            Market focus
          </span>
          {selectedMarkets.size === 0 && (
            <span className="text-xs text-slate-400 dark:text-slate-500">(all markets — select one or more to focus)</span>
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
                    ? "bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500 shadow-sm"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400"
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
              className="px-3 py-1.5 rounded-full text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-600 hover:border-slate-400 hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Background */}
      <div className="flex gap-2 items-center">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">
          Background
        </label>
        <input
          type="text"
          value={background}
          onChange={(e) => setBackground(e.target.value)}
          placeholder='e.g. "High Frequency Trading", "AI startup", "crypto exchange"'
          className="field"
          disabled={loading}
        />
      </div>

      {/* Job spec */}
      <div>
        <button
          type="button"
          onClick={() => setShowJobSpec((v) => !v)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-1"
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
              className="field resize-none font-mono"
              disabled={loading || parsingJD}
            />
            <button
              type="button"
              onClick={handleParseJD}
              disabled={!jobSpec.trim() || parsingJD || loading}
              className="px-4 py-1.5 bg-slate-800 dark:bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {parsingJD ? "Analyzing & searching…" : "Analyze & search"}
            </button>
            {parseError && <p className="text-xs text-red-500 dark:text-red-400">{parseError}</p>}
          </div>
        )}
      </div>

      {/* Parsed JD chips */}
      {parsedJD && (
        <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700">
          <div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Must haves</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {parsedJD.mustHaves.map((req) => (
                <span key={req} className="text-xs bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-full px-2.5 py-0.5 font-medium">
                  {req}
                </span>
              ))}
            </div>
          </div>
          {parsedJD.niceToHaves.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Nice to have</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {parsedJD.niceToHaves.map((req) => (
                  <span key={req} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-full px-2.5 py-0.5">
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
          className="field flex-1 !py-2.5 !px-4"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!canSearch}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
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

      {/* ── Sources + Language row ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Sources:</span>
          {ALL_SOURCES.map(({ id, label }) => (
            <label
              key={id}
              className={`flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                sources.has(id)
                  ? "bg-blue-50 dark:bg-blue-900/40 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500"
              }`}
            >
              <input type="checkbox" className="sr-only" checked={sources.has(id)} onChange={() => toggleSource(id)} disabled={loading} />
              {label}
            </label>
          ))}
        </div>

        <div className="ml-auto">
          <input
            type="text"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="Language (e.g. Rust)"
            className="field !w-40 !py-1.5"
            disabled={loading}
          />
        </div>
      </div>

      {/* ── Location ───────────────────────────────────────────────────── */}
      <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Location</p>

        {/* Region pills — multi-select; Global = clear all */}
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-500 mb-1.5">
            Region <span className="text-blue-500">*</span>
            <span className="text-slate-400 dark:text-slate-600 ml-1">(select one or more)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((r) => {
              const isGlobal = r.id === "global";
              const active = isGlobal
                ? settings.locationConfig.regions.length === 0
                : settings.locationConfig.regions.includes(r.id);

              return (
                <button
                  key={r.id}
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    setSettings((s) => {
                      if (isGlobal) {
                        // Global clears all region selections
                        return { ...s, locationConfig: { ...s.locationConfig, regions: [] } };
                      }
                      const current = s.locationConfig.regions;
                      const next = current.includes(r.id)
                        ? current.filter((x) => x !== r.id)
                        : [...current, r.id];
                      return { ...s, locationConfig: { ...s.locationConfig, regions: next } };
                    })
                  }
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    active
                      ? "bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-sm"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
                  }`}
                >
                  <span>{r.icon}</span>
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Countries tag input — optional */}
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-500 mb-1.5">
            Countries <span className="text-slate-400 dark:text-slate-600">(optional — press Enter to add)</span>
          </p>
          <div className="flex flex-wrap items-center gap-1.5 min-h-[34px] px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900 transition-all">
            {settings.locationConfig.countries.map((c) => (
              <span key={c} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 text-xs font-medium">
                {c}
                <button type="button" onClick={() => removeTag("countries", c)} className="text-blue-400 hover:text-blue-700 dark:hover:text-blue-200 transition-colors">×</button>
              </span>
            ))}
            <input
              type="text"
              value={countryInput}
              onChange={(e) => setCountryInput(e.target.value)}
              onKeyDown={(e) => handleTagKey(e, "countries", countryInput, setCountryInput)}
              onBlur={() => { addTag("countries", countryInput); setCountryInput(""); }}
              placeholder={settings.locationConfig.countries.length === 0 ? "e.g. United States, Germany…" : ""}
              className="flex-1 min-w-[120px] text-xs outline-none bg-transparent text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600"
              disabled={loading}
            />
          </div>
        </div>

        {/* Cities tag input — optional */}
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-500 mb-1.5">
            Cities <span className="text-slate-400 dark:text-slate-600">(optional — press Enter to add)</span>
          </p>
          <div className="flex flex-wrap items-center gap-1.5 min-h-[34px] px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900 transition-all">
            {settings.locationConfig.cities.map((c) => (
              <span key={c} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700 text-xs font-medium">
                {c}
                <button type="button" onClick={() => removeTag("cities", c)} className="text-violet-400 hover:text-violet-700 dark:hover:text-violet-200 transition-colors">×</button>
              </span>
            ))}
            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={(e) => handleTagKey(e, "cities", cityInput, setCityInput)}
              onBlur={() => { addTag("cities", cityInput); setCityInput(""); }}
              placeholder={settings.locationConfig.cities.length === 0 ? "e.g. New York, London, Singapore…" : ""}
              className="flex-1 min-w-[120px] text-xs outline-none bg-transparent text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600"
              disabled={loading}
            />
          </div>
        </div>

        {/* Location summary */}
        {(settings.locationConfig.regions.length > 0 ||
          settings.locationConfig.countries.length > 0 ||
          settings.locationConfig.cities.length > 0) && (
          <p className="text-xs text-slate-500 dark:text-slate-500">
            Searching:{" "}
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              {settings.locationConfig.cities.length > 0
                ? settings.locationConfig.cities.join(", ")
                : settings.locationConfig.countries.length > 0
                ? settings.locationConfig.countries.join(", ")
                : settings.locationConfig.regions
                    .map((id) => REGIONS.find((r) => r.id === id)?.label)
                    .filter(Boolean)
                    .join(" + ") + " (top tech hubs)"}
            </span>
          </p>
        )}
      </div>

      {/* Settings panel */}
      <div>
        <button
          type="button"
          onClick={() => setShowSettings((v) => !v)}
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium flex items-center gap-1 transition-colors"
        >
          <span>{showSettings ? "▾" : "▸"}</span>
          Search settings
        </button>

        {showSettings && (
          <div className="mt-3 space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
            {/* Years of experience */}
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">
                Min. experience
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[null, 2, 3, 5, 7, 10].map((yr) => (
                  <button
                    key={String(yr)}
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, minYears: yr }))}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      settings.minYears === yr
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500"
                    }`}
                  >
                    {yr === null ? "Any" : `${yr}+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Tier groups */}
            <div>
              <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Company tiers
                </p>
                {selectedMarkets.size > 0 && (
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-700 rounded-full px-2 py-0.5">
                    Auto-configured by market focus
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                {ALL_CATEGORIES.map((cat) => {
                  const active = settings.tierCategories.includes(cat);
                  const currentLevel = settings.tierMap[cat];
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`w-36 text-left px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          active
                            ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-slate-800 dark:border-slate-200"
                            : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-600"
                        }`}
                      >
                        {TIER_CATEGORY_LABELS[cat]}
                      </button>

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
                                  : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500"
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
