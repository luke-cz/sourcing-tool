"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { Candidate } from "@/lib/types";
import { SourceBadge } from "@/components/SourceBadge";

interface Props {
  candidate: Candidate;
  mustHaves?: string[];
  background?: string;
}

const TIER_CONFIG = {
  1: { label: "Tier 1", className: "bg-amber-50 text-amber-800 border-amber-300", title: "Elite background (FAANG, top trading firm, or leading AI/crypto company)" },
  2: { label: "Tier 2", className: "bg-slate-50 text-slate-700 border-slate-300", title: "Strong background (established tech or well-known startup)" },
};

export function CandidateCard({ candidate, mustHaves, background }: Props) {
  const [summary, setSummary] = useState<string | null>(candidate.summary);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState(false);

  useEffect(() => {
    if (summary || loadingSummary || summaryError) return;

    setLoadingSummary(true);
    fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidate, mustHaves, background }),
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
  const tierConfig = candidate.tier ? TIER_CONFIG[candidate.tier] : null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {candidate.avatarUrl ? (
            <Image
              src={candidate.avatarUrl}
              alt={displayName}
              width={48}
              height={48}
              className="rounded-full"
              unoptimized
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-lg font-semibold">
              {displayName[0]?.toUpperCase() ?? "?"}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 truncate">{displayName}</span>
            {candidate.openToWork === true && (
              <span className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 font-medium">
                Open to work
              </span>
            )}
            {tierConfig && (
              <span
                className={`text-xs border rounded-full px-2 py-0.5 font-semibold ${tierConfig.className}`}
                title={tierConfig.title}
              >
                {tierConfig.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <SourceBadge source={candidate.source} />
            {candidate.username !== displayName && (
              <span className="text-xs text-gray-500">@{candidate.username}</span>
            )}
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
        {candidate.location && (
          <span className="flex items-center gap-1">
            <LocationIcon />
            {candidate.location}
          </span>
        )}
        {candidate.company && (
          <span className="flex items-center gap-1">
            <CompanyIcon />
            {candidate.company}
          </span>
        )}
        {candidate.followers !== null && (
          <span className="flex items-center gap-1">
            <FollowersIcon />
            {candidate.followers.toLocaleString()} followers
          </span>
        )}
      </div>

      {/* Headline */}
      {candidate.headline && (
        <p className="text-sm text-gray-700 leading-snug line-clamp-2">{candidate.headline}</p>
      )}

      {/* Languages */}
      {candidate.languages.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {candidate.languages.slice(0, 5).map((lang) => (
            <span
              key={lang}
              className="text-xs bg-gray-100 text-gray-600 rounded-md px-2 py-0.5 font-mono"
            >
              {lang}
            </span>
          ))}
        </div>
      )}

      {/* Top repos */}
      {candidate.topRepos.length > 0 && (
        <div className="space-y-1">
          {candidate.topRepos.slice(0, 2).map((repo) => (
            <a
              key={repo.name}
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-blue-600 hover:underline truncate"
            >
              <span className="font-medium">{repo.name}</span>
              {repo.description && (
                <span className="text-gray-500"> — {repo.description}</span>
              )}
              {repo.stars > 0 && (
                <span className="text-gray-400 ml-1">★{repo.stars}</span>
              )}
            </a>
          ))}
        </div>
      )}

      {/* AI Summary */}
      <div className="border-t border-gray-100 pt-3">
        {loadingSummary && (
          <div className="space-y-1.5">
            <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-5/6" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-4/6" />
          </div>
        )}
        {summary && (
          <p className="text-sm text-gray-600 leading-relaxed">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide block mb-1">
              AI Summary
            </span>
            {summary}
          </p>
        )}
        {summaryError && (
          <p className="text-xs text-gray-400 italic">Summary unavailable</p>
        )}
      </div>

      {/* Footer */}
      <div className="pt-1">
        <a
          href={candidate.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View profile →
        </a>
      </div>
    </div>
  );
}

function LocationIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function CompanyIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function FollowersIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}
