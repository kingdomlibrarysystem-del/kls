"use client";

import { BookOpen, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
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
  const { user } = useAuth();
  const { data: resources } = useResources();
  const progress = useReadingProgress(user?.id);

  const rows = progress
    .filter((p) => p.status === "READING")
    .map((p) => ({ entry: p, resource: resources.find((r) => r.id === p.resourceId) }))
    .filter((r): r is { entry: typeof progress[number]; resource: NonNullable<typeof r.resource> } => !!r.resource);

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <BookOpen size={18} color="var(--gold)" />
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Currently Reading</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)" }}>{rows.length} {rows.length === 1 ? "book" : "books"}</span>
      </div>
      {rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>
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
              <div style={{ width: 36, height: 36, background: "var(--bg-section)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <BookOpen size={16} color="var(--gold)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{resource.title}</div>
                <div style={{ width: "100%", height: 3, background: "var(--bg-section)", borderRadius: 2, overflow: "hidden", marginTop: 3 }}>
                  <div style={{ width: `${percent}%`, height: "100%", background: "var(--gold)", borderRadius: 2 }} />
                </div>
              </div>
              <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>{percent}%</span>
            </a>
          );
        })
      )}
      <a href="/member/library" style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 12, color: "var(--gold)", textDecoration: "none" }}>
        Go to Kingdom Library <ChevronRight size={14} />
      </a>
    </div>
  );
}
