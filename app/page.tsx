"use client";

import { useState } from "react";
import { SearchForm } from "@/components/SearchForm";
import { ResultsGrid } from "@/components/ResultsGrid";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CandidateDetailPanel } from "@/components/CandidateDetailPanel";
import { CVLibraryTab } from "@/components/CVLibraryTab";
import { useShortlist } from "@/hooks/useShortlist";
import { useCVLibrary } from "@/hooks/useCVLibrary";
import type { Candidate, ParsedJD, SearchParams, SearchResponse } from "@/lib/types";

interface SearchContext {
  mustHaves?: string[];
  niceToHaves?: string[];
  background?: string;
  minYears?: number | null;
}

export default function Home() {
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [context, setContext] = useState<SearchContext>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchCollapsed, setSearchCollapsed] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const { shortlist, isSaved, toggle: toggleShortlist } = useShortlist();
  const { cvs, addCV, removeCV } = useCVLibrary();

  async function handleSearch(params: SearchParams & { background?: string }, parsedJD?: ParsedJD) {
    setLoading(true);
    setError(null);
    setResponse(null);
    setContext({
      mustHaves: parsedJD?.mustHaves,
      niceToHaves: parsedJD?.niceToHaves,
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
      setSearchCollapsed(true); // auto-collapse when results arrive
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Navbar ── */}
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
          </div>

          <div className="flex items-center gap-3">
            {shortlist.length > 0 && (
              <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full px-2.5 py-1">
                {shortlist.length} saved
              </span>
            )}
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* ── Search panel ── */}
      <div className="hero-bg bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-[#070d1a] dark:via-[#0a1224] dark:to-[#0d1530] px-4">
        {searchCollapsed && !loading ? (
          // Collapsed summary bar
          <div className="max-w-6xl mx-auto py-3 flex items-center justify-between">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {context.background && (
                <span className="font-medium text-slate-800 dark:text-slate-200">{context.background} · </span>
              )}
              {response && (
                <span>{response.candidates.length} candidates found</span>
              )}
            </div>
            <button
              onClick={() => setSearchCollapsed(false)}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit search
            </button>
          </div>
        ) : (
          // Full search form
          <div className="max-w-6xl mx-auto relative z-10 pt-6 pb-6">
            <div className="mb-5">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Candidate Sourcing</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                GitHub · Stack Overflow · LinkedIn — pedigree-first, AI-assessed
              </p>
            </div>
            <div className="glass rounded-2xl p-6">
              <SearchForm onSearch={handleSearch} loading={loading} />
            </div>
          </div>
        )}
      </div>

      {/* ── Results area ── */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">

        {error && (
          <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3.5 text-sm animate-fade-in">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

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
                <div key={i} className="candidate-card p-5 space-y-4 animate-pulse" style={{ animationDelay: `${i * 0.07}s` }}>
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && response && (
          <div className="animate-slide-up">
            <ResultsGrid
              response={response}
              shortlist={shortlist}
              isSaved={isSaved}
              onToggleSave={toggleShortlist}
              onSelectCandidate={setSelectedCandidate}
              mustHaves={context.mustHaves}
              niceToHaves={context.niceToHaves}
              background={context.background}
              minYears={context.minYears}
              cvs={cvs}
              onCVUpload={addCV}
              onCVRemove={removeCV}
            />
          </div>
        )}

        {!loading && !response && !error && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-slate-700 dark:text-slate-300 font-semibold">Ready to search</p>
                <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">Pick a market, set a location, and run a search</p>
              </div>
            </div>
            {/* CV Library always accessible */}
            <div>
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                CV Library
                {cvs.length > 0 && (
                  <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full px-2 py-0.5">
                    {cvs.length}
                  </span>
                )}
              </h2>
              <CVLibraryTab
                cvs={cvs}
                onUpload={addCV}
                onRemove={removeCV}
                mustHaves={context.mustHaves}
                niceToHaves={context.niceToHaves}
                background={context.background}
              />
            </div>
          </div>
        )}
      </div>
      {/* ── Candidate detail panel ── */}
      {selectedCandidate && (
        <CandidateDetailPanel
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          isSaved={isSaved(selectedCandidate.id)}
          onToggleSave={toggleShortlist}
          mustHaves={context.mustHaves}
          background={context.background}
          minYears={context.minYears}
        />
      )}
    </div>
  );
}
