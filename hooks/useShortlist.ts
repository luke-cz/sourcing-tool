"use client";

import { useState, useEffect, useCallback } from "react";
import type { Candidate } from "@/lib/types";

const STORAGE_KEY = "sourcing_shortlist_v1";

export function useShortlist() {
  const [shortlist, setShortlist] = useState<Candidate[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setShortlist(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = useCallback((next: Candidate[]) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    setShortlist(next);
  }, []);

  const isSaved = useCallback(
    (id: string) => shortlist.some((c) => c.id === id),
    [shortlist]
  );

  const toggle = useCallback(
    (candidate: Candidate) => {
      setShortlist((prev) => {
        const exists = prev.some((c) => c.id === candidate.id);
        const next = exists ? prev.filter((c) => c.id !== candidate.id) : [...prev, candidate];
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
    },
    []
  );

  const clear = useCallback(() => persist([]), [persist]);

  return { shortlist, isSaved, toggle, clear };
}
