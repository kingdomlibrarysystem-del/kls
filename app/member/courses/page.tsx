"use client";
import { PlayCircle, GraduationCap, ChevronRight, Clock, Award } from "lucide-react";

const mockCourses = [
  { id: 1, title: "Kingdom Foundations", progress: 75, lessons: 12, completed: 9, instructor: "Dr. Myles Munroe", image: "📚" },
  { id: 2, title: "Understanding Divine Purpose", progress: 40, lessons: 10, completed: 4, instructor: "Dr. Myles Munroe", image: "🎯" },
  { id: 3, title: "Leadership & Governance", progress: 10, lessons: 15, completed: 1, instructor: "Dr. Myles Munroe", image: "🛡️" },
  { id: 4, title: "The Art of Worship", progress: 100, lessons: 8, completed: 8, instructor: "Dr. Myles Munroe", image: "🎵" },
];

export default function MyCoursesPage() {
  const inProgress = mockCourses.filter((c) => c.progress < 100);
  const completed = mockCourses.filter((c) => c.progress === 100);
  const totalProgress = mockCourses.length ? Math.round(mockCourses.reduce((s, c) => s + c.progress, 0) / mockCourses.length) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Cinzel',serif" }}>
          My Courses
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          Track your enrolled courses and continue learning
        </div>
      </div>

      {/* Overall progress */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 16px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "conic-gradient(var(--teal-light) " + totalProgress + "%, var(--bg-section) " + totalProgress + "%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--teal-light)" }}>
            {totalProgress}%
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>Overall Progress</div>
          <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 1 }}>{completed.length} of {mockCourses.length} courses completed</div>
        </div>
        <Award size={24} color="var(--gold)" />
      </div>

      {/* In progress */}
      {inProgress.length > 0 && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
            <PlayCircle size={14} color="var(--teal-light)" /> Continue Learning
          </div>
          {inProgress.map((c) => (
            <div key={c.id} style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-light)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--bg-section)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{c.image}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{c.title}</div>
                <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 4 }}>{c.instructor} • {c.completed}/{c.lessons} lessons</div>
                <div style={{ width: "100%", height: 4, background: "var(--bg-section)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${c.progress}%`, height: "100%", background: "var(--teal-light)", borderRadius: 2, transition: "width 0.3s" }} />
                </div>
              </div>
              <button style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid var(--teal-light)", background: "transparent", color: "var(--teal-light)", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                Resume
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
            <Award size={14} color="var(--gold)" /> Completed
          </div>
          {completed.map((c) => (
            <div key={c.id} style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: "rgba(212,168,67,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{c.image}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{c.title}</div>
                <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{c.lessons} lessons • Completed</div>
              </div>
              <ChevronRight size={14} color="var(--text-muted)" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
