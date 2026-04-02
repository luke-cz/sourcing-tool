"use client";

import { useState, FormEvent } from "react";
import type { SearchParams, Source } from "@/lib/types";

const ALL_SOURCES: { id: Source; label: string }[] = [
  { id: "github", label: "GitHub" },
  { id: "hackernews", label: "HackerNews" },
  { id: "stackoverflow", label: "Stack Overflow" },
  { id: "linkedin", label: "LinkedIn" },
];

interface Props {
  onSearch: (params: SearchParams) => void;
  loading: boolean;
}

export function SearchForm({ onSearch, loading }: Props) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [language, setLanguage] = useState("");
  const [sources, setSources] = useState<Set<Source>>(
    new Set(["github", "hackernews", "stackoverflow"])
  );

  function toggleSource(source: Source) {
    setSources((prev) => {
      const next = new Set(prev);
      if (next.has(source)) {
        if (next.size === 1) return prev; // keep at least one
        next.delete(source);
      } else {
        next.add(source);
      }
      return next;
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch({
      query: query.trim(),
      sources: [...sources],
      location: location.trim() || undefined,
      language: language.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Main search row */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='e.g. "React developer" or "machine learning engineer"'
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
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

      {/* Filters row */}
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
