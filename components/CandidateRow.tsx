"use client";

import Image from "next/image";
import type { Candidate } from "@/lib/types";
import { TIER_CATEGORY_LABELS } from "@/lib/tiers";
import { SourceBadge } from "@/components/SourceBadge";

interface Props {
  candidate: Candidate;
  isSaved: boolean;
  onToggleSave: (c: Candidate) => void;
  onSelect?: (c: Candidate) => void;
}

export function CandidateRow({ candidate, isSaved, onToggleSave, onSelect }: Props) {
  const displayName = candidate.name ?? candidate.username;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group ${onSelect ? "cursor-pointer" : ""}`}
      onClick={() => onSelect?.(candidate)}
    >

      {/* Avatar */}
      <div className="shrink-0">
        {candidate.avatarUrl ? (
          <Image src={candidate.avatarUrl} alt={displayName} width={32} height={32}
            className="rounded-full ring-1 ring-slate-200 dark:ring-slate-700" unoptimized />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
            {displayName[0]?.toUpperCase() ?? "?"}
          </div>
        )}
      </div>

      {/* Name + badges */}
      <div className="w-48 shrink-0 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{displayName}</span>
          {candidate.tier === 1 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 shrink-0">
              ✦ T1{candidate.tierCategory ? ` · ${TIER_CATEGORY_LABELS[candidate.tierCategory]}` : ""}
            </span>
          )}
          {candidate.tier === 2 && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 shrink-0">T2</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <SourceBadge source={candidate.source} />
          {candidate.followers !== null && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500">{candidate.followers.toLocaleString()} followers</span>
          )}
        </div>
      </div>

      {/* Headline */}
      <p className="flex-1 text-xs text-slate-600 dark:text-slate-400 truncate hidden sm:block">
        {candidate.headline ?? candidate.bio ?? "—"}
      </p>

      {/* Location */}
      <span className="w-28 shrink-0 text-xs text-slate-400 dark:text-slate-500 truncate hidden md:block">
        {candidate.location ?? "—"}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSave(candidate); }}
          title={isSaved ? "Remove from shortlist" : "Add to shortlist"}
          className={`p-1.5 rounded-md transition-colors ${
            isSaved
              ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
              : "text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400"
          }`}
        >
          <BookmarkIcon filled={isSaved} />
        </button>
        <a
          href={candidate.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium opacity-0 group-hover:opacity-100 transition-opacity"
        >
          View →
        </a>
      </div>
    </div>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M5 4a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 20V4z" />
    </svg>
  ) : (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 4a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 20V4z" />
    </svg>
  );
}
