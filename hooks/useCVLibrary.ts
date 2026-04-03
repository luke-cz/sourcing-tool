"use client";

import { useState, useEffect, useCallback } from "react";
import type { CVLibraryEntry } from "@/lib/types";

const STORAGE_KEY = "sourcing_cv_library_v1";

export function useCVLibrary() {
  const [cvs, setCVs] = useState<CVLibraryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCVs(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const persist = useCallback((list: CVLibraryEntry[]) => {
    setCVs(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // storage full — fail silently
    }
  }, []);

  const addCV = useCallback((entry: CVLibraryEntry) => {
    setCVs((prev) => {
      const next = [entry, ...prev.filter((c) => c.id !== entry.id)];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const removeCV = useCallback((id: string) => {
    setCVs((prev) => {
      const next = prev.filter((c) => c.id !== id);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const clearAll = useCallback(() => persist([]), [persist]);

  return { cvs, addCV, removeCV, clearAll };
}
