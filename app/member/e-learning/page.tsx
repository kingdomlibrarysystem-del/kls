"use client";
import { useState } from "react";
import { PlayCircle, Clock, Star, Search, CheckCircle2 } from "lucide-react";
import { courseCatalog, courseCategories } from "../_shared/course-catalog-data";
import { useEnrollments, enrollInCourse } from "../_shared/use-enrollments";

export default function ELearningPage() {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [enrollError, setEnrollError] = useState("");
  const enrollments = useEnrollments();

  const filtered = courseCatalog.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCat === "All" || c.category === activeCat;
    return matchSearch && matchCat;
  });

  const handleEnroll = (courseId: string, totalLessons: number) => {
    setEnrollError("");
    try {
      enrollInCourse(courseId, totalLessons);
    } catch (error) {
      setEnrollError(error instanceof Error ? error.message : "Could not enroll in this course");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Cinzel',serif" }}>
          E-Learning
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          Expand your knowledge with our course catalog
        </div>
      </div>

      {enrollError && (
        <div role="alert" style={{ background: "var(--red-dim)", color: "var(--red-light)", border: "1px solid var(--red)", borderRadius: 6, padding: "8px 12px", fontSize: 11 }}>
          {enrollError}
        </div>
      )}

      {/* Search */}
      <div style={{ position: "relative" }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search courses"
          style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-input, var(--bg-card))", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
        />
      </div>

      {/* Categories */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {courseCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            aria-pressed={activeCat === cat}
            style={{
              padding: "5px 12px", borderRadius: 20, border: "1px solid var(--border)", cursor: "pointer",
              fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
              background: activeCat === cat ? "var(--teal-light)" : "transparent",
              color: activeCat === cat ? "#fff" : "var(--text-secondary)",
              transition: "all 0.15s",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Course grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" style={{ display: "grid", gap: 12 }}>
        {filtered.map((course) => {
          const enrolled = enrollments.some((e) => e.courseId === course.id);
          return (
            <div key={course.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", transition: "transform 0.2s", cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.12)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
            >
              {/* Header */}
              <div style={{ height: 100, background: "linear-gradient(135deg, var(--teal-light-transparent, rgba(45,212,191,0.1)), var(--bg-section))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <course.image size={32} color="var(--teal-light)" />
              </div>
              {/* Body */}
              <div style={{ padding: "10px 12px 12px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{course.title}</div>
                <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 6 }}>{course.instructor}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 8, color: "var(--teal-light)", background: "rgba(45,212,191,0.1)", padding: "1px 6px", borderRadius: 3 }}>{course.category}</span>
                  <span style={{ fontSize: 8, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 2 }}><Clock size={10} />{course.duration}</span>
                  <span style={{ fontSize: 8, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 2 }}><Star size={10} color="var(--gold)" />{course.rating}</span>
                </div>
                <div style={{ fontSize: 9, color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {course.description}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <PlayCircle size={14} color="var(--teal-light)" />
                  <span style={{ fontSize: 9, color: "var(--text-muted)", flex: 1 }}>{course.lessons} lessons</span>
                  <button
                    onClick={() => handleEnroll(course.id, course.lessons)}
                    disabled={enrolled}
                    aria-label={enrolled ? `Already enrolled in ${course.title}` : `Enroll in ${course.title}`}
                    style={{
                      display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 6, border: "none",
                      background: enrolled ? "var(--bg-section)" : "var(--teal-light)",
                      color: enrolled ? "var(--text-muted)" : "#fff",
                      fontSize: 10, fontWeight: 600, cursor: enrolled ? "default" : "pointer",
                    }}
                  >
                    {enrolled && <CheckCircle2 size={11} />}
                    {enrolled ? "Enrolled" : "Enroll"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
