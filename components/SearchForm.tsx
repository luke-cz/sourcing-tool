"use client";

import { useState, FormEvent } from "react";
import type { ParsedJD, SearchParams, Source } from "@/lib/types";

const ALL_SOURCES: { id: Source; label: string }[] = [
  { id: "github", label: "GitHub" },
  { id: "hackernews", label: "HackerNews" },
  { id: "stackoverflow", label: "Stack Overflow" },
  { id: "linkedin", label: "LinkedIn" },
];

interface Props {
  onSearch: (params: SearchParams & { background?: string }, parsedJD?: ParsedJD) => void;
  loading: boolean;
}

export function SearchForm({ onSearch, loading }: Props) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [language, setLanguage] = useState("");
  const [background, setBackground] = useState("");
  const [jobSpec, setJobSpec] = useState("");
  const [showJobSpec, setShowJobSpec] = useState(false);
  const [sources, setSources] = useState<Set<Source>>(
    new Set(["github", "hackernews", "stackoverflow"])
  );
  const [parsedJD, setParsedJD] = useState<ParsedJD | null>(null);
  const [parsingJD, setParsingJD] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

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
      setParsedJD(data as ParsedJD);
      // Auto-fill query from parsed JD
      if (data.searchQuery) setQuery(data.searchQuery);
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

    onSearch(
      {
        query: effectiveQuery,
        sources: [...sources],
        location: location.trim() || undefined,
        language: language.trim() || undefined,
        background: background.trim() || undefined,
        mustHaves: parsedJD?.mustHaves,
        niceToHaves: parsedJD?.niceToHaves,
      },
      parsedJD ?? undefined
    );
  }

  const canSearch = (query.trim() || parsedJD?.searchQuery) && !loading;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Background row */}
      <div className="flex gap-2 items-center">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
          Background
        </label>
        <input
          type="text"
          value={background}
          onChange={(e) => setBackground(e.target.value)}
          placeholder='e.g. "High Frequency Trading", "AI startup", "crypto exchange"'
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        />
      </div>

      {/* Job spec toggle */}
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
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
              disabled={loading || parsingJD}
            />
            <button
              type="button"
              onClick={handleParseJD}
              disabled={!jobSpec.trim() || parsingJD || loading}
              className="px-4 py-1.5 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {parsingJD ? "Analyzing…" : "Analyze requirements"}
            </button>
            {parseError && (
              <p className="text-xs text-red-600">{parseError}</p>
            )}
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
          placeholder={parsedJD ? parsedJD.searchQuery : 'e.g. "React developer" or "machine learning engineer"'}
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          ) : (
            "Search"
          )}
        </button>
      </div>

      {/* Sources + filters */}
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
              <input
                type="checkbox"
                className="sr-only"
                checked={sources.has(id)}
                onChange={() => toggleSource(id)}
                disabled={loading}
              />
              {label}
            </label>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="w-32 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <input
            type="text"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="Language"
            className="w-32 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>
      </div>
    </form>
  );
}
