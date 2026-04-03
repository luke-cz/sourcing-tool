"use client";

import { useState, useMemo } from "react";
import type { Candidate, Source, SearchResponse } from "@/lib/types";
import { CandidateCard } from "@/components/CandidateCard";
import { CandidateRow } from "@/components/CandidateRow";

interface Props {
  response: SearchResponse;
  shortlist: Candidate[];
  isSaved: (id: string) => boolean;
  onToggleSave: (c: Candidate) => void;
  mustHaves?: string[];
  background?: string;
  minYears?: number | null;
}

const SOURCE_LABELS: Record<Source, string> = {
  github: "GitHub",
  stackoverflow: "Stack Overflow",
  linkedin: "LinkedIn",
};

const SOURCE_COLORS: Record<Source, string> = {
  github: "bg-slate-800 dark:bg-slate-700 text-white",
  stackoverflow: "bg-amber-500 text-white",
  linkedin: "bg-blue-600 text-white",
};

type Tab = "results" | "shortlist";
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

export function ResultsGrid({ response, shortlist, isSaved, onToggleSave, mustHaves, background, minYears }: Props) {
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
        {(["results", "shortlist"] as Tab[]).map((t) => {
          const count = t === "results" ? candidates.length : shortlist.length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
                tab === t
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {t === "results" ? "Results" : "Shortlist"}
              <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${
                tab === t
                  ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Stats + tier pills (results tab only) ── */}
      {tab === "results" && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            <strong className="text-slate-900 dark:text-white">{candidates.length}</strong> candidates
          </span>
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(countsBySource) as [Source, number][]).map(([src, n]) => (
              <span key={src} className={`text-xs font-semibold rounded-full px-2.5 py-1 ${SOURCE_COLORS[src]}`}>
                {SOURCE_LABELS[src]} · {n}
              </span>
            ))}
            {tier1Count > 0 && (
              <span className="text-xs font-bold rounded-full px-2.5 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900">
                ✦ {tier1Count} Tier 1
              </span>
            )}
            {tier2Count > 0 && (
              <span className="text-xs font-semibold rounded-full px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {tier2Count} Tier 2
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Toolbar: filters + sort + view toggle + export ── */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Source filter */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          {(["all", "github", "linkedin", "stackoverflow"] as const).map((s) => {
            const label = s === "all" ? "All" : SOURCE_LABELS[s as Source];
            const active = sourceFilter === s;
            return (
              <button key={s} onClick={() => setSourceFilter(s)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  active ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Tier filter */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          {([["all", "All"], ["1", "Tier 1"], ["2", "Tier 2"], ["none", "Untiered"]] as [TierFilter, string][]).map(([v, label]) => (
            <button key={v} onClick={() => setTierFilter(v)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                tierFilter === v ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 outline-none focus:border-blue-400"
        >
          <option value="default">Sort: Tier first</option>
          <option value="followers">Sort: Followers ↓</option>
        </select>

        {/* Right-side controls */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Export */}
          <button
            onClick={() => exportCSV(filtered)}
            title="Export as CSV"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>

          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button
              onClick={() => setView("grid")}
              title="Grid view"
              className={`p-1.5 transition-colors ${view === "grid" ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600"}`}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z" />
              </svg>
            </button>
            <button
              onClick={() => setView("list")}
              title="List view"
              className={`p-1.5 transition-colors ${view === "list" ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600"}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

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

      {/* ── Empty shortlist ── */}
      {tab === "shortlist" && shortlist.length === 0 && (
        <div className="text-center py-16 text-slate-400 dark:text-slate-600">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 4a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 20V4z" />
          </svg>
          <p className="text-sm">No saved candidates yet — click the bookmark icon on any card</p>
        </div>
      )}

      {/* ── Candidates ── */}
      {filtered.length > 0 && (
        view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <CandidateCard key={c.id} candidate={c} mustHaves={mustHaves} background={background}
                minYears={minYears} isSaved={isSaved(c.id)} onToggleSave={onToggleSave} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {filtered.map((c) => (
              <CandidateRow key={c.id} candidate={c} isSaved={isSaved(c.id)} onToggleSave={onToggleSave} />
            ))}
          </div>
        )
      )}

      {/* ── No results after filtering ── */}
      {filtered.length === 0 && (tab === "results" ? candidates.length > 0 : shortlist.length > 0) && (
        <p className="text-center py-10 text-sm text-slate-400 dark:text-slate-600">No candidates match the current filters</p>
      )}
    </div>
  );
}
