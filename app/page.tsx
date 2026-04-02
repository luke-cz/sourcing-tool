"use client";

import { useState } from "react";
import { SearchForm } from "@/components/SearchForm";
import { ResultsGrid } from "@/components/ResultsGrid";
import type { SearchParams, SearchResponse } from "@/lib/types";

export default function Home() {
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(params: SearchParams) {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const data: SearchResponse = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Candidate Sourcing</h1>
        <p className="text-sm text-gray-500 mt-1">
          Search across GitHub, HackerNews, Stack Overflow, and LinkedIn
        </p>
      </div>

      {/* Search */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <SearchForm onSearch={handleSearch} loading={loading} />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="h-3 bg-gray-100 rounded" />
                <div className="h-3 bg-gray-100 rounded w-5/6" />
              </div>
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && response && <ResultsGrid response={response} />}

      {/* Empty state before first search */}
      {!loading && !response && !error && (
        <div className="text-center py-20 text-gray-400">
          <SearchIcon />
          <p className="mt-3 text-sm">Enter a search query to find candidates</p>
          <p className="text-xs mt-1">
            Try "React developer", "machine learning", or "backend engineer"
          </p>
        </div>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      className="mx-auto h-12 w-12 text-gray-300"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}
