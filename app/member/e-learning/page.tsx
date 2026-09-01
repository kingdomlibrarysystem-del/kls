"use client";
import { useState } from "react";
import Link from "next/link";
import { PlayCircle, Clock, Star, Search, CheckCircle2, GraduationCap } from "lucide-react";
import { RemoteImage } from "@/components/ui/remote-image";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useCourses, type CatalogCourse } from "../_shared/use-courses";
import { useEnrollments, enrollInCourse } from "../_shared/use-enrollments";
import { CourseCheckoutModal } from "../courses/_components/course-checkout-modal";

/** Courses shown per page — keeps a large catalog from rendering unbounded. */
const PAGE_SIZE = 9;

export default function ELearningPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [page, setPage] = useState(1);
  const [enrollError, setEnrollError] = useState("");
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [checkoutCourse, setCheckoutCourse] = useState<CatalogCourse | null>(null);
  const { user } = useAuth();
  const { data: courseCatalog, loading: coursesLoading } = useCourses();
  const { data: enrollments, loading: enrollmentsLoading, refetch } = useEnrollments();

  const categories = ["All", ...Array.from(new Set(courseCatalog.map((c) => c.category))).sort()];

  const filtered = courseCatalog.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCat === "All" || c.category === activeCat;
    return matchSearch && matchCat;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleEnroll = async (course: CatalogCourse) => {
    if (!user) return;
    if (course.price > 0) {
      setCheckoutCourse(course);
      return;
    }
    setEnrollError("");
    setEnrolling(course.id);
    try {
      await enrollInCourse(user.id, course.id);
      await refetch();
    } catch (error) {
      setEnrollError(error instanceof Error ? error.message : "Could not enroll in this course");
    } finally {
      setEnrolling(null);
    }
  };

  if (coursesLoading || enrollmentsLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }} aria-label="Loading courses">
        <Skeleton style={{ height: 40, borderRadius: 8 }} />
        <Skeleton style={{ height: 220, borderRadius: 8 }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Cinzel',serif" }}>
          {t("m_elearning.title")}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
          {t("m_elearning.subtitle")}
        </div>
      </div>

      {enrollError && (
        <div role="alert" style={{ background: "var(--red-dim)", color: "var(--red-light)", border: "1px solid var(--red)", borderRadius: 6, padding: "8px 12px", fontSize: 13 }}>
          {enrollError}
        </div>
      )}

      {/* Search */}
      <div style={{ position: "relative" }}>
        <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input
          placeholder={t("m_elearning.search_placeholder")}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          aria-label={t("m_elearning.search_placeholder")}
          style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-input, var(--bg-card))", color: "var(--text-primary)", fontSize: 15, outline: "none" }}
        />
      </div>

      {/* Categories */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => { setActiveCat(cat); setPage(1); }}
            aria-pressed={activeCat === cat}
            style={{
              padding: "6px 12px", borderRadius: 20, border: "1px solid var(--border)", cursor: "pointer",
              fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
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
        {paged.map((course) => {
          const enrolled = enrollments.some((e) => e.courseId === course.id);
          return (
            <div key={course.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", transition: "transform 0.2s", cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.12)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
            >
              {/* Header */}
              <div style={{ height: 100, position: "relative", background: "linear-gradient(135deg, var(--teal-light-transparent, rgba(45,212,191,0.1)), var(--bg-section))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {course.image ? (
                  <RemoteImage
                    src={course.image}
                    alt={course.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    style={{ objectFit: "cover" }}
                    fallback={<GraduationCap size={32} color="var(--teal-light)" />}
                  />
                ) : (
                  <GraduationCap size={32} color="var(--teal-light)" />
                )}
              </div>
              {/* Body */}
              <div style={{ padding: "10px 12px 12px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{course.title}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>{course.instructor}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, color: "var(--teal-light)", background: "rgba(45,212,191,0.1)", padding: "1px 6px", borderRadius: 3 }}>{course.category}</span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 2 }}><Clock size={12} />{course.duration}</span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 2 }}><Star size={12} color="var(--gold)" />{course.rating}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {course.description}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <PlayCircle size={16} color="var(--teal-light)" />
                  <span style={{ fontSize: 11, color: "var(--text-muted)", flex: 1 }}>{course.lessons} {t("m_elearning.lessons")}</span>
                  {enrolled ? (
                    <Link
                      href={`/member/courses/${course.id}`}
                      aria-label={`${t("m_elearning.view_course")} ${course.title}`}
                      style={{
                        display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 6, border: "none",
                        background: "var(--teal-light)", color: "#fff", fontSize: 12, fontWeight: 600, textDecoration: "none",
                      }}
                    >
                      <CheckCircle2 size={13} /> {t("m_elearning.view_course")}
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleEnroll(course)}
                      disabled={enrolling === course.id}
                      aria-label={course.price > 0 ? `Pay to enroll in ${course.title}` : `Enroll in ${course.title}`}
                      style={{
                        display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 6, border: "none",
                        background: "var(--teal-light)", color: "#fff",
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        opacity: enrolling === course.id ? 0.7 : 1,
                      }}
                    >
                      {enrolling === course.id ? t("m_elearning.enrolling") : course.price > 0 ? `Pay ${course.price.toLocaleString()} RWF` : t("m_elearning.enroll_free")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: 13 }}>
          {t("m_elearning.no_courses_match")}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontSize: 13, cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.4 : 1 }}
          >
            Previous
          </button>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontSize: 13, cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.4 : 1 }}
          >
            Next
          </button>
        </div>
      )}

      <CourseCheckoutModal
        course={checkoutCourse}
        onClose={() => setCheckoutCourse(null)}
        onPaid={() => { refetch(); setCheckoutCourse(null); }}
      />
    </div>
  );
}
