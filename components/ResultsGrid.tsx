"use client";

import type { Candidate, Source, SearchResponse } from "@/lib/types";
import { CandidateCard } from "@/components/CandidateCard";

interface Props {
  response: SearchResponse;
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

export function ResultsGrid({ response, mustHaves, background, minYears }: Props) {
  const { candidates, errors } = response;

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

  const countsBySource = candidates.reduce<Partial<Record<Source, number>>>((acc, c) => {
    acc[c.source] = (acc[c.source] ?? 0) + 1;
    return acc;
  }, {});

  const tier1Count = candidates.filter((c) => c.tier === 1).length;
  const tier2Count = candidates.filter((c) => c.tier === 2).length;

  return (
    <div className="space-y-5">

      {/* ── Stats bar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{candidates.length}</span>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">candidates found</span>
        </div>

        <div className="flex flex-wrap gap-2 ml-auto items-center">
          {/* Source pills */}
          {(Object.entries(countsBySource) as [Source, number][]).map(([src, n]) => (
            <span
              key={src}
              className={`text-xs font-semibold rounded-full px-2.5 py-1 ${SOURCE_COLORS[src]}`}
            >
              {SOURCE_LABELS[src]} · {n}
            </span>
          ))}

          {/* Tier pills */}
          {tier1Count > 0 && (
            <span className="text-xs font-bold rounded-full px-2.5 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 shadow-sm">
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

      {/* ── Source errors ── */}
      {errors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {errors.map((err) => (
            <span
              key={err.source}
              className="text-xs bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900 rounded-lg px-3 py-1.5"
              title={err.message}
            >
              ⚠ {SOURCE_LABELS[err.source]} unavailable
            </span>
          ))}
        </div>
      )}

      {/* ── Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {candidates.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            mustHaves={mustHaves}
            background={background}
            minYears={minYears}
          />
        ))}
      </div>
    </div>
  );
}
