"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { Candidate } from "@/lib/types";
import { TIER_CATEGORY_LABELS } from "@/lib/tiers";
import { SourceBadge } from "@/components/SourceBadge";

interface Props {
  candidate: Candidate;
  mustHaves?: string[];
  background?: string;
  minYears?: number | null;
  isSaved?: boolean;
  onToggleSave?: (c: Candidate) => void;
  onSelect?: (c: Candidate) => void;
}

export function CandidateCard({ candidate, mustHaves, background, minYears, isSaved = false, onToggleSave, onSelect }: Props) {
  const [summary, setSummary] = useState<string | null>(candidate.summary);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState(false);

  useEffect(() => {
    if (summary || loadingSummary || summaryError) return;
    setLoadingSummary(true);
    fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidate, mustHaves, background, minYears }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.summary) setSummary(data.summary);
        else setSummaryError(true);
      })
      .catch(() => setSummaryError(true))
      .finally(() => setLoadingSummary(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate.id]);

  const displayName = candidate.name ?? candidate.username;

  return (
    <div
      className={`candidate-card p-5 flex flex-col gap-3 ${onSelect ? "cursor-pointer" : ""}`}
      onClick={() => onSelect?.(candidate)}
    >

      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 relative">
          {candidate.avatarUrl ? (
            <Image
              src={candidate.avatarUrl}
              alt={displayName}
              width={48}
              height={48}
              className="rounded-full ring-2 ring-white dark:ring-slate-800 shadow-sm"
              unoptimized
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-lg font-bold shadow-sm">
              {displayName[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          {candidate.openToWork === true && (
            <span
              title="Open to work"
              className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 border-2 border-white dark:border-slate-900 rounded-full"
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className="font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">
              {displayName}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <TierBadge tier={candidate.tier} category={candidate.tierCategory} />
              {onToggleSave && (
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleSave(candidate); }}
                  title={isSaved ? "Remove from shortlist" : "Save to shortlist"}
                  className={`p-1 rounded-md transition-colors ${
                    isSaved
                      ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                      : "text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400"
                  }`}
                >
                  {isSaved ? (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 4a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 20V4z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 4a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 20V4z" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <SourceBadge source={candidate.source} />
            {candidate.username !== displayName && (
              <span className="text-xs text-slate-400 dark:text-slate-500">@{candidate.username}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Meta row ── */}
      {(candidate.location || candidate.company || candidate.followers !== null) && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          {candidate.location && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {candidate.location}
            </span>
          )}
          {candidate.company && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {candidate.company}
            </span>
          )}
          {candidate.followers !== null && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {candidate.followers.toLocaleString()}
            </span>
          )}
        </div>
      )}

      {/* ── Headline ── */}
      {candidate.headline && (
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">
          {candidate.headline}
        </p>
      )}

      {/* ── Languages ── */}
      {candidate.languages.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {candidate.languages.slice(0, 5).map((lang) => (
            <span
              key={lang}
              className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-0.5 font-mono"
            >
              {lang}
            </span>
          ))}
        </div>
      )}

      {/* ── Top repos ── */}
      {candidate.topRepos.length > 0 && (
        <div className="space-y-1.5">
          {candidate.topRepos.slice(0, 2).map((repo) => (
            <a
              key={repo.name}
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 group"
            >
              <svg className="w-3 h-3 mt-0.5 shrink-0 opacity-60" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
              </svg>
              <span className="font-medium truncate">{repo.name}</span>
              {repo.description && (
                <span className="text-slate-400 dark:text-slate-500 truncate hidden sm:inline"> — {repo.description}</span>
              )}
              {repo.stars > 0 && (
                <span className="text-amber-500 dark:text-amber-400 ml-auto shrink-0">★{repo.stars}</span>
              )}
            </a>
          ))}
        </div>
      )}

      {/* ── AI Summary ── */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-auto">
        {loadingSummary && (
          <div className="space-y-1.5">
            <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse w-full" />
            <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse w-5/6" />
            <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse w-4/6" />
          </div>
        )}
        {summary && !loadingSummary && (
          <div>
            <span className="text-[10px] font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-widest block mb-1.5">
              AI Assessment
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{summary}</p>
          </div>
        )}
        {summaryError && (
          <p className="text-xs text-slate-400 dark:text-slate-600 italic">Assessment unavailable</p>
        )}
      </div>

      {/* ── Footer ── */}
      <a
        href={candidate.profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors group"
      >
        View profile
        <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </a>
    </div>
  );
}

/* ── Tier badge ─────────────────────────────────────────────────────────── */
function TierBadge({ tier, category }: { tier: 1 | 2 | null; category: string | null }) {
  if (!tier) return null;

  const label = TIER_CATEGORY_LABELS[category as keyof typeof TIER_CATEGORY_LABELS] ?? "";

  if (tier === 1) {
    return (
      <span
        title="Company pedigree: Tier 1 — worked at an elite firm (top trading, FAANG, leading AI/crypto). Does NOT indicate role fit — check the AI assessment below."
        className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 shadow-sm cursor-help"
      >
        ✦ T1{label ? ` · ${label}` : ""}
      </span>
    );
  }

  return (
    <span
      title="Company pedigree: Tier 2 — established tech company or well-known startup. Does NOT indicate role fit — check the AI assessment below."
      className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 cursor-help"
    >
      T2{label ? ` · ${label}` : ""}
    </span>
  );
}
