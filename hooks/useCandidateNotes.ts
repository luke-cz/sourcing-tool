"use client";

import { useCallback } from "react";

const PREFIX = "sourcing_note_";

export function useCandidateNotes() {
  const getNote = useCallback((candidateId: string): string => {
    try {
      return localStorage.getItem(PREFIX + candidateId) ?? "";
    } catch {
      return "";
    }
  }, []);

  const setNote = useCallback((candidateId: string, text: string) => {
    try {
      if (text.trim()) {
        localStorage.setItem(PREFIX + candidateId, text);
      } else {
        localStorage.removeItem(PREFIX + candidateId);
      }
    } catch {
      // ignore
    }
  }, []);

  return { getNote, setNote };
}
