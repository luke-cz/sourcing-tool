"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import type { Candidate } from "@/lib/types";
import { TIER_CATEGORY_LABELS } from "@/lib/tiers";
import { SourceBadge } from "@/components/SourceBadge";
import { useCandidateNotes } from "@/hooks/useCandidateNotes";

interface Props {
  candidate: Candidate;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (c: Candidate) => void;
  mustHaves?: string[];
  background?: string;
  minYears?: number | null;
}

export function CandidateDetailPanel({
  candidate,
  onClose,
  isSaved,
  onToggleSave,
  mustHaves,
  background,
  minYears,
}: Props) {
  const [summary, setSummary] = useState<string | null>(candidate.summary);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [note, setNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { getNote, setNote: persistNote } = useCandidateNotes();

  const displayName = candidate.name ?? candidate.username;

  // Load note from localStorage
  useEffect(() => {
    setNote(getNote(candidate.id));
  }, [candidate.id, getNote]);

  // Load summary if not already present
  useEffect(() => {
    if (summary || loadingSummary) return;
    setLoadingSummary(true);
    fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidate, mustHaves, background, minYears }),
    })
      .then((r) => r.json())
      .then((data) => { if (data.summary) setSummary(data.summary); })
      .catch(() => {})
      .finally(() => setLoadingSummary(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate.id]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Auto-save note with debounce
  function handleNoteChange(text: string) {
    setNote(text);
    setNoteSaved(false);
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => {
      persistNote(candidate.id, text);
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2000);
    }, 800);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden animate-slide-in-right">

        {/* Header */}
        <div className="flex items-start gap-4 px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex-shrink-0 relative">
            {candidate.avatarUrl ? (
              <Image
                src={candidate.avatarUrl}
                alt={displayName}
                width={56}
                height={56}
                className="rounded-full ring-2 ring-white dark:ring-slate-800 shadow"
                unoptimized
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xl font-bold shadow">
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
              <h2 className="font-bold text-lg text-slate-900 dark:text-white leading-tight truncate">
                {displayName}
              </h2>
              <div className="flex items-center gap-2 shrink-0">
                {/* Save to shortlist */}
                <button
                  onClick={() => onToggleSave(candidate)}
                  title={isSaved ? "Remove from shortlist" : "Save to shortlist"}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isSaved
                      ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                      : "text-slate-400 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400"
                  }`}
                >
                  {isSaved ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 4a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 20V4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 4a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 20V4z" />
                    </svg>
                  )}
                </button>
                {/* Close */}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <SourceBadge source={candidate.source} />
              {candidate.tier && (
                <TierBadge tier={candidate.tier} category={candidate.tierCategory} />
              )}
              {candidate.username !== displayName && (
                <span className="text-xs text-slate-400 dark:text-slate-500">@{candidate.username}</span>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Meta */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-500 dark:text-slate-400">
            {candidate.location && (
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {candidate.location}
              </span>
            )}
            {candidate.company && (
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {candidate.company}
              </span>
            )}
            {candidate.followers !== null && (
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {candidate.followers.toLocaleString()} followers
              </span>
            )}
          </div>

          {/* Headline / Bio */}
          {candidate.headline && (
            <div>
              <SectionLabel>Headline</SectionLabel>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{candidate.headline}</p>
            </div>
          )}

          {candidate.bio && candidate.bio !== candidate.headline && (
            <div>
              <SectionLabel>Bio</SectionLabel>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                {candidate.bio.slice(0, 600)}{candidate.bio.length > 600 ? "…" : ""}
              </p>
            </div>
          )}

          {/* AI Assessment */}
          <div>
            <SectionLabel>AI Assessment</SectionLabel>
            {loadingSummary && (
              <div className="space-y-2 mt-1">
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse w-full" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse w-5/6" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse w-4/6" />
              </div>
            )}
            {summary && !loadingSummary && (
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-lg px-3.5 py-3">
                {summary}
              </p>
            )}
            {!summary && !loadingSummary && (
              <p className="text-xs text-slate-400 italic">Assessment unavailable</p>
            )}
          </div>

          {/* Skills / Languages */}
          {candidate.languages.length > 0 && (
            <div>
              <SectionLabel>Skills & Languages</SectionLabel>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {candidate.languages.map((lang) => (
                  <span
                    key={lang}
                    className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md px-2.5 py-1 font-mono"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Repositories */}
          {candidate.topRepos.length > 0 && (
            <div>
              <SectionLabel>Repositories</SectionLabel>
              <div className="space-y-2 mt-1">
                {candidate.topRepos.map((repo) => (
                  <a
                    key={repo.name}
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group"
                  >
                    <svg className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:underline truncate">
                          {repo.name}
                        </span>
                        {repo.stars > 0 && (
                          <span className="text-xs text-amber-500 dark:text-amber-400 shrink-0 font-medium">★ {repo.stars}</span>
                        )}
                      </div>
                      {repo.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{repo.description}</p>
                      )}
                      {repo.language && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1 block">{repo.language}</span>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <SectionLabel>Private notes</SectionLabel>
              {noteSaved && (
                <span className="text-[10px] text-emerald-500 font-medium animate-fade-in">Saved ✓</span>
              )}
            </div>
            <textarea
              value={note}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder="Add a private note about this candidate…"
              rows={4}
              className="w-full text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:border-blue-400 dark:focus:border-blue-500 resize-none transition-colors"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <a
            href={candidate.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            View full profile
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <button
            onClick={() => onToggleSave(candidate)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isSaved
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300"
            }`}
          >
            {isSaved ? (
              <>
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 4a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 20V4z" />
                </svg>
                Shortlisted
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 4a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 20V4z" />
                </svg>
                Add to shortlist
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
      {children}
    </span>
  );
}

function TierBadge({ tier, category }: { tier: 1 | 2 | null; category: string | null }) {
  if (!tier) return null;
  const label = TIER_CATEGORY_LABELS[category as keyof typeof TIER_CATEGORY_LABELS] ?? "";
  if (tier === 1) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 shadow-sm">
        ✦ T1{label ? ` · ${label}` : ""}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
      T2{label ? ` · ${label}` : ""}
    </span>
  );
}
