"use client";

import { useState, useMemo } from "react";
import type { Candidate, Source, SearchResponse, CVLibraryEntry } from "@/lib/types";
import { CandidateCard } from "@/components/CandidateCard";
import { CandidateRow } from "@/components/CandidateRow";
import { CVLibraryTab } from "@/components/CVLibraryTab";

interface Props {
  response: SearchResponse;
  shortlist: Candidate[];
  isSaved: (id: string) => boolean;
  onToggleSave: (c: Candidate) => void;
  onSelectCandidate?: (c: Candidate) => void;
  mustHaves?: string[];
  niceToHaves?: string[];
  background?: string;
  minYears?: number | null;
  cvs: CVLibraryEntry[];
  onCVUpload: (entry: CVLibraryEntry) => void;
  onCVRemove: (id: string) => void;
}

const SOURCE_LABELS: Record<Source, string> = {
  github: "GitHub",
  stackoverflow: "Stack Overflow",
  linkedin: "LinkedIn",
  cv: "CV",
};

const SOURCE_COLORS: Record<Source, string> = {
  github: "bg-slate-800 dark:bg-slate-700 text-white",
  stackoverflow: "bg-amber-500 text-white",
  linkedin: "bg-blue-600 text-white",
  cv: "bg-violet-600 text-white",
};

type Tab = "results" | "shortlist" | "cv_library";
type ViewMode = "grid" | "list";
type SortKey = "default" | "followers";
type TierFilter = "all" | "1" | "2" | "none";

function exportCSV(candidates: Candidate[]) {
  const header = ["Name", "Username", "Source", "Tier", "Tier Category", "Location", "Headline", "Profile URL"];
  const rows = candidates.map((c) => [
    c.name ?? c.username,
    c.username,
    c.source,
    c.tier ?? "",
    c.tierCategory ?? "",
    c.location ?? "",
    (c.headline ?? "").replace(/,/g, ";"),
    c.profileUrl,
  ]);
  const csv = [header, ...rows].map((r) => r.map(String).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `candidates_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ResultsGrid({ response, shortlist, isSaved, onToggleSave, onSelectCandidate, mustHaves, niceToHaves, background, minYears, cvs, onCVUpload, onCVRemove }: Props) {
  const { candidates, errors } = response;

  const [tab, setTab] = useState<Tab>("results");
  const [view, setView] = useState<ViewMode>("grid");
  const [sourceFilter, setSourceFilter] = useState<Source | "all">("all");
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [sort, setSort] = useState<SortKey>("default");

  const baseList = tab === "shortlist" ? shortlist : candidates;

  const filtered = useMemo(() => {
    let list = [...baseList];
    if (sourceFilter !== "all") list = list.filter((c) => c.source === sourceFilter);
    if (tierFilter === "1") list = list.filter((c) => c.tier === 1);
    else if (tierFilter === "2") list = list.filter((c) => c.tier === 2);
    else if (tierFilter === "none") list = list.filter((c) => c.tier === null);
    if (sort === "followers") list.sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0));
    return list;
  }, [baseList, sourceFilter, tierFilter, sort]);

  const tier1Count = candidates.filter((c) => c.tier === 1).length;
  const tier2Count = candidates.filter((c) => c.tier === 2).length;

  const countsBySource = candidates.reduce<Partial<Record<Source, number>>>((acc, c) => {
    acc[c.source] = (acc[c.source] ?? 0) + 1;
    return acc;
  }, {});

  if (candidates.length === 0 && errors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500 dark:text-slate-400">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="font-semibold text-slate-700 dark:text-slate-300">No candidates found</p>
        <p className="text-sm">Try broader terms, different locations, or enable more sources</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800">
        {([
          { key: "results", label: "Results", count: candidates.length },
          { key: "shortlist", label: "Shortlist", count: shortlist.length },
          { key: "cv_library", label: "CV Library", count: cvs.length },
        ] as { key: Tab; label: string; count: number }[]).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
              tab === key
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {label}
            <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${
              tab === key
                ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Single control bar: count + clickable filter pills + sort + view + export ── */}
      {tab === "results" && (
        <div className="flex flex-wrap items-center gap-2">

          {/* Total count */}
          <span className="text-sm font-semibold text-slate-900 dark:text-white mr-1">
            {filtered.length}
            {filtered.length !== candidates.length && (
              <span className="text-slate-400 dark:text-slate-500 font-normal"> / {candidates.length}</span>
            )}
            <span className="text-slate-500 dark:text-slate-400 font-normal text-xs ml-1">candidates</span>
          </span>

          {/* "All" reset pill */}
          <button
            onClick={() => { setSourceFilter("all"); setTierFilter("all"); }}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              sourceFilter === "all" && tierFilter === "all"
                ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-transparent"
                : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400"
            }`}
          >
            All
          </button>

          {/* Source pills — click to filter */}
          {(Object.entries(countsBySource) as [Source, number][]).map(([src, n]) => {
            const active = sourceFilter === src;
            return (
              <button
                key={src}
                onClick={() => setSourceFilter(active ? "all" : src)}
                className={`text-xs font-semibold rounded-full px-2.5 py-1 transition-all border-2 ${
                  active
                    ? `${SOURCE_COLORS[src]} border-white/40 scale-105 shadow-md`
                    : `${SOURCE_COLORS[src]} opacity-50 border-transparent hover:opacity-80`
                }`}
              >
                {SOURCE_LABELS[src]} · {n}
              </button>
            );
          })}

          {/* Tier pills — click to filter */}
          {tier1Count > 0 && (
            <button
              onClick={() => setTierFilter(tierFilter === "1" ? "all" : "1")}
              className={`text-xs font-bold rounded-full px-2.5 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 transition-all border-2 ${
                tierFilter === "1" ? "border-amber-600 scale-105 shadow-md" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              ✦ {tier1Count} Tier 1
            </button>
          )}
          {tier2Count > 0 && (
            <button
              onClick={() => setTierFilter(tierFilter === "2" ? "all" : "2")}
              className={`text-xs font-semibold rounded-full px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all border-2 ${
                tierFilter === "2" ? "border-slate-500 scale-105 shadow-md" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {tier2Count} Tier 2
            </button>
          )}

          {/* Right side: sort + view toggle + export */}
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 outline-none focus:border-blue-400"
            >
              <option value="default">Tier first</option>
              <option value="followers">Followers ↓</option>
            </select>

            <button
              onClick={() => exportCSV(filtered)}
              title="Export visible candidates as CSV"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              CSV
            </button>

            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <button onClick={() => setView("grid")} title="Grid view"
                className={`p-1.5 transition-colors ${view === "grid" ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600"}`}
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z" />
                </svg>
              </button>
              <button onClick={() => setView("list")} title="List view"
                className={`p-1.5 transition-colors ${view === "list" ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600"}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Source errors ── */}
      {errors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {errors.map((err) => (
            <span key={err.source} className="text-xs bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900 rounded-lg px-3 py-1.5" title={err.message}>
              ⚠ {SOURCE_LABELS[err.source]} unavailable
            </span>
          ))}
        </div>
      )}

      {/* ── CV Library tab ── */}
      {tab === "cv_library" && (
        <CVLibraryTab
          cvs={cvs}
          onUpload={onCVUpload}
          onRemove={onCVRemove}
          mustHaves={mustHaves}
          niceToHaves={niceToHaves}
          background={background}
        />
      )}

      {/* ── Empty shortlist ── */}
      {tab === "shortlist" && shortlist.length === 0 && (
        <div className="text-center py-16 text-slate-400 dark:text-slate-600">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 4a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 20V4z" />
          </svg>
          <p className="text-sm">No saved candidates yet — click the bookmark icon on any card</p>
        </div>
      )}

      {/* ── Candidates (results + shortlist tabs) ── */}
      {tab !== "cv_library" && filtered.length > 0 && (
        view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <CandidateCard key={c.id} candidate={c} mustHaves={mustHaves} background={background}
                minYears={minYears} isSaved={isSaved(c.id)} onToggleSave={onToggleSave} onSelect={onSelectCandidate} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {filtered.map((c) => (
              <CandidateRow key={c.id} candidate={c} isSaved={isSaved(c.id)} onToggleSave={onToggleSave} onSelect={onSelectCandidate} />
            ))}
          </div>
        )
      )}

      {/* ── No results after filtering ── */}
      {tab !== "cv_library" && filtered.length === 0 && (tab === "results" ? candidates.length > 0 : shortlist.length > 0) && (
        <p className="text-center py-10 text-sm text-slate-400 dark:text-slate-600">No candidates match the current filters</p>
      )}
    </div>
  );
}
