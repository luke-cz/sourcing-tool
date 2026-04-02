"use client";

import type { Source } from "@/lib/types";

const config: Record<Source, { label: string; className: string }> = {
  github: {
    label: "GitHub",
    className: "bg-gray-800 text-white",
  },
  linkedin: {
    label: "LinkedIn",
    className: "bg-blue-600 text-white",
  },
  hackernews: {
    label: "HN",
    className: "bg-orange-500 text-white",
  },
  stackoverflow: {
    label: "Stack Overflow",
    className: "bg-amber-500 text-white",
  },
};

export function SourceBadge({ source }: { source: Source }) {
  const { label, className } = config[source];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
