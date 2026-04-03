"use client";

import { useState, useRef, useCallback } from "react";
import type { CVLibraryEntry, CVMatch } from "@/lib/types";

interface Props {
  cvs: CVLibraryEntry[];
  onUpload: (entry: CVLibraryEntry) => void;
  onRemove: (id: string) => void;
  mustHaves?: string[];
  niceToHaves?: string[];
  background?: string;
}

export function CVLibraryTab({ cvs, onUpload, onRemove, mustHaves, background, niceToHaves }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [matching, setMatching] = useState(false);
  const [matches, setMatches] = useState<CVMatch[] | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasJD = (mustHaves?.length ?? 0) > 0 || !!background;

  async function processFile(file: File) {
    if (file.type !== "application/pdf") {
      setUploadError("Only PDF files are supported.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File must be under 5 MB.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Strip the data URL prefix
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/parse-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdf: base64 }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const { parsed } = await res.json();
      const entry: CVLibraryEntry = {
        id: `cv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        parsed,
      };
      onUpload(entry);
      // Reset matches when new CV is uploaded
      setMatches(null);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      // Upload all files sequentially
      for (const file of Array.from(files)) {
        await processFile(file);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  async function matchCVsToJD() {
    if (!cvs.length || !hasJD) return;
    setMatching(true);
    setMatchError(null);
    setMatches(null);
    try {
      const res = await fetch("/api/match-cvs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvs, mustHaves, niceToHaves, background }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const { matches: m } = await res.json();
      setMatches(m);
    } catch (err) {
      setMatchError(err instanceof Error ? err.message : "Matching failed");
    } finally {
      setMatching(false);
    }
  }

  // Build a lookup from cvId → match result
  const matchMap = new Map<string, CVMatch>(matches?.map((m) => [m.cvId, m]) ?? []);

  // Sort CVs: if matches, put highest-scoring first
  const sortedCVs = matches
    ? [...cvs].sort((a, b) => (matchMap.get(b.id)?.score ?? -1) - (matchMap.get(a.id)?.score ?? -1))
    : cvs;

  return (
    <div className="space-y-6">

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
          dragging
            ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
            : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800/30"
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Parsing CV with AI…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Drop CVs here or <span className="text-blue-600 dark:text-blue-400">browse</span>
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">PDF files up to 5 MB each. Claude will parse each CV automatically.</p>
            </div>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2.5">
          ⚠ {uploadError}
        </div>
      )}

      {/* JD matching CTA */}
      {cvs.length > 0 && (
        <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl px-5 py-3.5">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {hasJD ? "Rank CVs against current JD" : "Paste a JD in the search form to rank these CVs"}
            </p>
            {hasJD && background && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-sm">
                {background}
              </p>
            )}
          </div>
          {hasJD && (
            <button
              onClick={matchCVsToJD}
              disabled={matching}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
            >
              {matching ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Matching…
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Match CVs
                </>
              )}
            </button>
          )}
        </div>
      )}

      {matchError && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2.5">
          ⚠ {matchError}
        </div>
      )}

      {/* CV list */}
      {sortedCVs.length === 0 ? (
        <div className="text-center py-12 text-slate-400 dark:text-slate-600">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">No CVs uploaded yet</p>
          <p className="text-xs mt-1">Upload engineer CVs above. When you paste a JD, this library will rank them by fit.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {cvs.length} CVs ranked by fit ↓ — highest match first
            </p>
          )}
          {sortedCVs.map((entry) => {
            const match = matchMap.get(entry.id);
            return (
              <CVCard
                key={entry.id}
                entry={entry}
                match={match}
                onRemove={() => onRemove(entry.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function CVCard({
  entry,
  match,
  onRemove,
}: {
  entry: CVLibraryEntry;
  match?: CVMatch;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const p = entry.parsed;
  const displayName = p.name ?? entry.fileName.replace(/\.pdf$/i, "");

  const scoreColor =
    !match ? "" :
    match.score >= 75 ? "text-emerald-600 dark:text-emerald-400" :
    match.score >= 50 ? "text-amber-600 dark:text-amber-400" :
    "text-red-500 dark:text-red-400";

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-600">
      <div className="flex items-start gap-3 p-4">

        {/* Score ring / icon */}
        <div className="shrink-0">
          {match ? (
            <div className={`w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center ${
              match.score >= 75 ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20" :
              match.score >= 50 ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20" :
              "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
            }`}>
              <span className={`text-sm font-bold ${scoreColor}`}>{match.score}</span>
              <span className="text-[8px] text-slate-400 dark:text-slate-500 leading-none">/ 100</span>
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{displayName}</h3>
              {p.headline && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{p.headline}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setExpanded((x) => !x)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={expanded ? "Collapse" : "Expand"}
              >
                <svg className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                onClick={onRemove}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Remove CV"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-400 dark:text-slate-500">
            {p.location && <span>📍 {p.location}</span>}
            {p.experience.length > 0 && <span>💼 {p.experience.length} roles</span>}
            {p.skills.length > 0 && <span>🛠 {p.skills.slice(0, 4).join(", ")}{p.skills.length > 4 ? ` +${p.skills.length - 4}` : ""}</span>}
          </div>

          {/* AI match summary */}
          {match?.summary && (
            <p className={`text-xs mt-2 font-medium ${scoreColor}`}>{match.summary}</p>
          )}
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-3">

          {/* Match details */}
          {match && (match.strengths.length > 0 || match.gaps.length > 0) && (
            <div className="grid grid-cols-2 gap-3">
              {match.strengths.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1.5">Strengths</p>
                  <ul className="space-y-1">
                    {match.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                        <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {match.gaps.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-1.5">Gaps</p>
                  <ul className="space-y-1">
                    {match.gaps.map((g, i) => (
                      <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                        <span className="text-red-400 mt-0.5 shrink-0">✗</span>{g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* CV summary */}
          {p.summary && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Summary</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{p.summary}</p>
            </div>
          )}

          {/* Experience */}
          {p.experience.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Experience</p>
              <div className="space-y-2">
                {p.experience.map((exp, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {exp.title} · <span className="font-normal text-slate-500">{exp.company}</span>
                        {exp.duration && <span className="text-slate-400"> ({exp.duration})</span>}
                      </p>
                      {exp.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{exp.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All skills */}
          {p.skills.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {p.skills.map((skill, i) => (
                  <span key={i} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-0.5 font-mono">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {p.education.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Education</p>
              <ul className="space-y-0.5">
                {p.education.map((edu, i) => (
                  <li key={i} className="text-xs text-slate-600 dark:text-slate-400">{edu}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[10px] text-slate-300 dark:text-slate-600">
            Uploaded {new Date(entry.uploadedAt).toLocaleDateString()} · {entry.fileName}
          </p>
        </div>
      )}
    </div>
  );
}
