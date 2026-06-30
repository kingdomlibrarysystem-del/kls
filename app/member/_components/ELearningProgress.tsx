"use client";

import { GraduationCap, ChevronRight, PlayCircle, Award } from "lucide-react";

const mockCourses = [
  { title: "Kingdom Foundations", progress: 75, lessons: 12, completed: 9 },
  { title: "Understanding Divine Purpose", progress: 40, lessons: 10, completed: 4 },
  { title: "Leadership & Governance", progress: 10, lessons: 15, completed: 1 },
];

export default function ELearningProgress() {
  const totalProgress = mockCourses.length ? Math.round(mockCourses.reduce((s, c) => s + c.progress, 0) / mockCourses.length) : 0;

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <GraduationCap size={16} color="var(--teal-light)" />
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>E-Learning Progress</span>
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--text-muted)" }}>
          <Award size={12} /> {totalProgress}% overall
        </span>
      </div>
      {mockCourses.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: 11 }}>
          Not enrolled in any courses yet.{" "}
          <a href="/member/e-learning" style={{ color: "var(--gold)", textDecoration: "underline" }}>Explore courses</a>
        </div>
      ) : (
        mockCourses.map((c) => (
          <div key={c.title} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <PlayCircle size={12} color="var(--teal-light)" />
              <span style={{ flex: 1, fontSize: 10, fontWeight: 600, color: "var(--text-primary)" }}>{c.title}</span>
              <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{c.completed}/{c.lessons} lessons</span>
            </div>
            <div style={{ width: "100%", height: 4, background: "var(--bg-section)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${c.progress}%`, height: "100%", background: "var(--teal-light)", borderRadius: 2, transition: "width 0.3s" }} />
            </div>
          </div>
        ))
      )}
      <a href="/member/courses" style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 10, color: "var(--gold)", textDecoration: "none" }}>
        View all courses <ChevronRight size={12} />
      </a>
    </div>
  );
}
