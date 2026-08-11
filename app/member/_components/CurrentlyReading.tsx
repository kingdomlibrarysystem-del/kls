"use client";

import { BookOpen, ChevronRight } from "lucide-react";
import { useResources } from "@/app/dashboard/library/_components/use-resources";
import { useReadingProgress, getReadingProgressPercent } from "@/app/member/_shared/use-reading-progress";

/**
 * Dashboard-home widget for in-progress reading, mirroring
 * ELearningProgress.tsx's live-wired pattern — every title and
 * percentage here is real, derived from the same
 * useReadingProgress()/useResources() stores the reader and
 * /member/library's own Continue Reading section already read.
 */
export default function CurrentlyReading() {
  const { data: resources } = useResources();
  const progress = useReadingProgress();

  const rows = progress
    .filter((p) => p.status === "READING")
    .map((p) => ({ entry: p, resource: resources.find((r) => r.id === p.resourceId) }))
    .filter((r): r is { entry: typeof progress[number]; resource: NonNullable<typeof r.resource> } => !!r.resource);

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <BookOpen size={16} color="var(--gold)" />
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>Currently Reading</span>
        <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-muted)" }}>{rows.length} {rows.length === 1 ? "book" : "books"}</span>
      </div>
      {rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: 11 }}>
          Not reading anything yet.{" "}
          <a href="/member/library" style={{ color: "var(--gold)", textDecoration: "underline" }}>Browse the library</a>
        </div>
      ) : (
        rows.map(({ entry, resource }) => {
          const percent = getReadingProgressPercent(entry);
          return (
            <a
              key={resource.id}
              href={`/member/library/read/${resource.id}`}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--border-light)", textDecoration: "none" }}
            >
              <div style={{ width: 32, height: 32, background: "var(--bg-section)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <BookOpen size={14} color="var(--gold)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{resource.title}</div>
                <div style={{ width: "100%", height: 3, background: "var(--bg-section)", borderRadius: 2, overflow: "hidden", marginTop: 3 }}>
                  <div style={{ width: `${percent}%`, height: "100%", background: "var(--gold)", borderRadius: 2 }} />
                </div>
              </div>
              <span style={{ fontSize: 9, color: "var(--text-muted)", flexShrink: 0 }}>{percent}%</span>
            </a>
          );
        })
      )}
      <a href="/member/library" style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 10, color: "var(--gold)", textDecoration: "none" }}>
        Go to Kingdom Library <ChevronRight size={12} />
      </a>
    </div>
  );
}
