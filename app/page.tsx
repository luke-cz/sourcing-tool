"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchForm } from "@/components/SearchForm";
import { ResultsGrid } from "@/components/ResultsGrid";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CandidateDetailPanel } from "@/components/CandidateDetailPanel";
import { CVLibraryTab } from "@/components/CVLibraryTab";
import { useShortlist } from "@/hooks/useShortlist";
import { useCVLibrary } from "@/hooks/useCVLibrary";
import type { Candidate, ParsedJD, SearchParams, SearchResponse } from "@/lib/types";

type AppView = "sourcing" | "cv_library";

interface SearchContext {
  mustHaves?: string[];
  niceToHaves?: string[];
  background?: string;
  minYears?: number | null;
}

const NAV_ITEMS: { key: AppView; label: string; icon: React.ReactNode; description: string }[] = [
  {
    key: "sourcing",
    label: "Sourcing",
    description: "GitHub · LinkedIn · Stack Overflow",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    key: "cv_library",
    label: "CV Library",
    description: "Upload & match CVs to JDs",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export default function Home() {
  const [view, setView] = useState<AppView>("sourcing");
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [context, setContext] = useState<SearchContext>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchCollapsed, setSearchCollapsed] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { shortlist, isSaved, toggle: toggleShortlist } = useShortlist();
  const { cvs, addCV, removeCV } = useCVLibrary();
  const router = useRouter();

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
      setSearchCollapsed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070d1a]">

      {/* ── Top navbar ── */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0a1224]/90 backdrop-blur-md">
        <div className="flex items-center gap-3 h-14 px-4">

          {/* Mobile menu button */}
          <button
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setSidebarOpen((x) => !x)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2.5 mr-auto">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-sm">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight hidden sm:block">
              Talent<span className="text-blue-600 dark:text-blue-400">Scout</span>
            </span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {shortlist.length > 0 && view === "sourcing" && (
              <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full px-2.5 py-1">
                {shortlist.length} saved
              </span>
            )}
            {cvs.length > 0 && view === "cv_library" && (
              <span className="text-xs font-semibold bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded-full px-2.5 py-1">
                {cvs.length} CVs
              </span>
            )}
            <ThemeToggle />
            {process.env.NODE_ENV !== "development" && (
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">

        {/* ── Sidebar ── */}
        <>
          {/* Mobile backdrop */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/30 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <aside className={`
            fixed md:sticky top-14 left-0 z-30 h-[calc(100vh-3.5rem)]
            w-60 shrink-0 flex flex-col
            bg-white dark:bg-[#0a1224]
            border-r border-slate-200 dark:border-slate-800
            transition-transform duration-200
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}>

            {/* Nav section label */}
            <div className="px-4 pt-5 pb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">
                Tools
              </p>
            </div>

            {/* Nav items */}
            <nav className="flex-1 px-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const active = view === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => { setView(item.key); setSidebarOpen(false); }}
                    className={`
                      w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left
                      transition-all group
                      ${active
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                      }
                    `}
                  >
                    <span className={`mt-0.5 shrink-0 ${active ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`}>
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight">{item.label}</p>
                      <p className="text-[11px] mt-0.5 opacity-60 truncate">{item.description}</p>
                    </div>
                  </button>
                );
              })}

              {/* Coming soon placeholder */}
              <div className="px-3 py-2.5 rounded-xl opacity-40 cursor-not-allowed select-none flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-500">More soon…</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-600 mt-0.5">Pipeline, outreach, etc.</p>
                </div>
              </div>
            </nav>

            {/* Sidebar footer */}
            <div className="px-4 py-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] text-slate-300 dark:text-slate-700 text-center">
                Personal use only — data stays on your device
              </p>
            </div>
          </aside>
        </>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 overflow-auto">

          {/* ── SOURCING VIEW ── */}
          {view === "sourcing" && (
            <div className="flex flex-col min-h-full">

              {/* Search panel */}
              <div className="bg-gradient-to-br from-blue-50/60 via-white to-violet-50/60 dark:from-[#070d1a] dark:via-[#0a1224] dark:to-[#0d1530] border-b border-slate-200 dark:border-slate-800 px-6">
                {searchCollapsed && !loading ? (
                  <div className="py-3 flex items-center justify-between">
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
                  <div className="pt-6 pb-6">
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

              {/* Results area */}
              <div className="flex-1 px-6 py-6">
                {error && (
                  <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3.5 text-sm animate-fade-in mb-4">
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
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="w-2 h-2 rounded-full bg-blue-400 dark:bg-blue-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                      <span className="text-sm text-slate-500 dark:text-slate-400">Searching across sources…</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
                    />
                  </div>
                )}

                {!loading && !response && !error && (
                  <div className="flex flex-col items-center justify-center py-24 gap-4 animate-fade-in">
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
                )}
              </div>
            </div>
          )}

          {/* ── CV LIBRARY VIEW ── */}
          {view === "cv_library" && (
            <div className="px-6 py-6 max-w-3xl">
              <div className="mb-6">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">CV Library</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Upload engineer CVs — Claude parses them automatically. Paste a JD in Sourcing to rank them by fit.
                </p>
              </div>
              <CVLibraryTab
                cvs={cvs}
                onUpload={addCV}
                onRemove={removeCV}
                mustHaves={context.mustHaves}
                niceToHaves={context.niceToHaves}
                background={context.background}
              />
            </div>
          )}

        </main>
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
