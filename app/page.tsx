"use client";

import { useState } from "react";
import { SearchForm } from "@/components/SearchForm";
import { ResultsGrid } from "@/components/ResultsGrid";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { ParsedJD, SearchParams, SearchResponse } from "@/lib/types";

interface SearchContext {
  mustHaves?: string[];
  background?: string;
  minYears?: number | null;
}

export default function Home() {
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [context, setContext] = useState<SearchContext>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(params: SearchParams & { background?: string }, parsedJD?: ParsedJD) {
    setLoading(true);
    setError(null);
    setResponse(null);
    setContext({
      mustHaves: parsedJD?.mustHaves,
      background: params.background,
      minYears: params.minYears,
    });

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
    <div className="min-h-screen flex flex-col">

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#070d1a]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-md">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight">
              Talent<span className="text-blue-600 dark:text-blue-400">Scout</span>
            </span>
            <span className="hidden sm:inline-block text-xs font-medium text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 rounded-full px-2 py-0.5 ml-1">
              Pedigree-first search
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* ── Hero + Search ────────────────────────────────────────────────── */}
      <div className="hero-bg bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-[#070d1a] dark:via-[#0a1224] dark:to-[#0d1530] pt-10 pb-8 px-4">
        <div className="max-w-6xl mx-auto relative z-10">

          {/* Hero text */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Find the{" "}
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                best engineers
              </span>
              <br className="hidden sm:block" /> before anyone else does
            </h1>
            <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
              Pedigree-first search across GitHub, Stack Overflow &amp; LinkedIn — powered by AI
            </p>
          </div>

          {/* Glass search panel */}
          <div className="glass rounded-2xl p-6">
            <SearchForm onSearch={handleSearch} loading={loading} />
          </div>
        </div>
      </div>

      {/* ── Results area ─────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3.5 text-sm animate-fade-in">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-blue-400 dark:bg-blue-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">Searching across sources…</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="candidate-card p-5 space-y-4 animate-pulse"
                  style={{ animationDelay: `${i * 0.07}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-3/4" />
                      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full w-5/6" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full w-4/6" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-5 w-14 bg-slate-100 dark:bg-slate-800 rounded-full" />
                    <div className="h-5 w-10 bg-slate-100 dark:bg-slate-800 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && response && (
          <div className="animate-slide-up">
            <ResultsGrid
              response={response}
              mustHaves={context.mustHaves}
              background={context.background}
              minYears={context.minYears}
            />
          </div>
        )}

        {/* Empty state */}
        {!loading && !response && !error && (
          <div className="flex flex-col items-center justify-center py-24 gap-5 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-violet-100 dark:from-blue-950 dark:to-violet-950 flex items-center justify-center shadow-inner">
              <svg className="w-9 h-9 text-blue-400 dark:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-slate-700 dark:text-slate-300 font-semibold text-lg">Ready to source talent</p>
              <p className="text-slate-500 dark:text-slate-500 text-sm mt-1.5 max-w-sm">
                Pick a market focus, paste a job spec, or type a search query above
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-400 dark:text-slate-600">
              {["📈 HFT / Quant", "⛓️ DeFi / Web3", "💳 Fintech", "🤖 AI / ML", "🏢 Big Tech"].map(label => (
                <span key={label} className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800">{label}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
