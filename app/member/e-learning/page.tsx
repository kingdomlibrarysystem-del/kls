"use client";
import { useState } from "react";
import { Search, GraduationCap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useCourses, type CatalogCourse } from "../_shared/use-courses";
import { useEnrollments, enrollInCourse, getProgressPercent } from "../_shared/use-enrollments";
import { CourseCheckoutModal } from "../courses/_components/course-checkout-modal";
import { getPublishedLessons, useLessonsByCourse } from "../_shared/use-lessons";
import { useAssessmentCatalog } from "../_shared/use-assessments";
import { CourseCard } from "./_components/course-card";

/** Courses shown per page — each course is a full-width card, so fewer per page. */
const PAGE_SIZE = 6;

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
  const { data: lessonsByCourse } = useLessonsByCourse();
  const { data: assessmentsById } = useAssessmentCatalog();
  const assessments = Object.values(assessmentsById);

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
      <div className="flex flex-col gap-4" aria-label="Loading courses">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-11 rounded-full" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <header className="flex items-center gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#12304a] text-primary shadow">
          <GraduationCap className="size-6" />
        </span>
        <div>
          <h1 className="font-cinzel text-2xl font-bold text-[#12304a] dark:text-[#f6efe0]">{t("m_elearning.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("m_elearning.subtitle")}</p>
        </div>
      </header>

      {enrollError && (
        <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {enrollError}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder={t("m_elearning.search_placeholder")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            aria-label={t("m_elearning.search_placeholder")}
            className="h-11 w-full rounded-full border border-border bg-card pl-11 pr-4 text-[15px] text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCat(cat); setPage(1); }}
              aria-pressed={activeCat === cat}
              className={`h-9 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition ${
                activeCat === cat
                  ? "border-[#12304a] bg-[#12304a] text-[#f6efe0] dark:border-primary dark:bg-primary dark:text-[#0b2136]"
                  : "border-border bg-card text-muted-foreground hover:border-primary/60 hover:text-foreground"
              }`}
            >
              {cat === "All" ? t("m_elearning.category_all") : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {paged.map((course) => {
          // A course the member left (DROPPED) shows Enroll again — enrolling brings their progress back.
          const enrollment = enrollments.find((e) => e.courseId === course.id && e.status !== "DROPPED");
          return (
            <CourseCard
              key={course.id}
              course={course}
              lessons={getPublishedLessons(lessonsByCourse[course.id]?.lessons)}
              assessments={assessments.filter((a) => a.courseId === course.id)}
              enrolled={!!enrollment}
              progress={enrollment ? getProgressPercent(enrollment) : 0}
              enrolling={enrolling === course.id}
              onEnroll={() => handleEnroll(course)}
            />
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          {t("m_elearning.no_courses_match")}
        </p>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-9 rounded-full border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("m_elearning.prev")}
          </button>
          <span className="text-sm text-muted-foreground">
            {t("m_elearning.page_of").replace("{p}", String(currentPage)).replace("{t}", String(totalPages))}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="h-9 rounded-full border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("m_elearning.next")}
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
