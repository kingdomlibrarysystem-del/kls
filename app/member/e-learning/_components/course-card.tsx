"use client";

import Link from "next/link";
import {
  Award, BookOpenText, CheckCircle2, ClipboardCheck, Clock, FileText, FolderKanban, GraduationCap,
  ListChecks, Loader2, Paperclip, PlayCircle, Star, Users,
} from "lucide-react";
import { RemoteImage } from "@/components/ui/remote-image";
import { useLanguage } from "@/contexts/language-context";
import type { CatalogCourse } from "../../_shared/use-courses";
import type { Lesson } from "../../_shared/lesson-data";
import type { TakeableAssessment } from "../../_shared/assessment-data";

/** Lessons listed in the "Course content" preview before "+ N more". */
const PREVIEW_LESSONS = 5;

const LESSON_ICON = { VIDEO: PlayCircle, TEXT: FileText, FILE: Paperclip } as const;

/** 45 → "45 min", 200 → "3 h 20 min". */
function formatMinutes(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

interface Props {
  course: CatalogCourse;
  /** The course's published lessons, in order. */
  lessons: Lesson[];
  /** Quizzes, exams and projects that belong to the course. */
  assessments: TakeableAssessment[];
  enrolled: boolean;
  /** 0–100 when enrolled. */
  progress: number;
  enrolling: boolean;
  onEnroll: () => void;
}

/**
 * One course in the member e-learning catalog, laid out like a course page
 * on a professional e-learning site: cover + overview on the left; what the
 * course includes, its lessons and the enroll button on the right. Every
 * number comes from the real lessons/assessments — nothing is shown when a
 * course doesn't have it (no fake ratings, no fake durations).
 */
export function CourseCard({ course, lessons, assessments, enrolled, progress, enrolling, onEnroll }: Props) {
  const { t } = useLanguage();
  const fill = (key: string, vars: Record<string, string | number>) =>
    Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), t(key));

  const totalMinutes = lessons.reduce((s, l) => s + (l.durationMinutes || 0), 0);
  const count = (type: Lesson["contentType"]) => lessons.filter((l) => l.contentType === type).length;
  const quizzes = assessments.filter((a) => a.kind === "QUIZ" || a.kind === "TEST").length;
  const hasExam = assessments.some((a) => a.kind === "EXAM");
  const hasProject = assessments.some((a) => a.kind === "PROJECT");
  const freeLessons = course.price > 0 ? lessons.filter((l) => l.access === "FREE").length : 0;
  const lessonCount = lessons.length || course.lessons;
  const rating = Number(course.rating);

  const includes = [
    lessonCount > 0 && { icon: BookOpenText, text: fill("m_elearning.n_lessons", { n: lessonCount }) },
    totalMinutes > 0 && { icon: Clock, text: fill("m_elearning.total_time", { t: formatMinutes(totalMinutes) }) },
    count("VIDEO") > 0 && { icon: PlayCircle, text: fill("m_elearning.n_videos", { n: count("VIDEO") }) },
    count("TEXT") > 0 && { icon: FileText, text: fill("m_elearning.n_readings", { n: count("TEXT") }) },
    count("FILE") > 0 && { icon: Paperclip, text: fill("m_elearning.n_files", { n: count("FILE") }) },
    quizzes > 0 && { icon: ListChecks, text: quizzes === 1 ? t("m_elearning.one_quiz") : fill("m_elearning.n_quizzes", { n: quizzes }) },
    hasExam && { icon: ClipboardCheck, text: t("m_elearning.final_exam") },
    hasProject && { icon: FolderKanban, text: t("m_elearning.project") },
    { icon: Award, text: t("m_elearning.certificate") },
  ].filter(Boolean) as { icon: typeof Clock; text: string }[];

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md">
      <div className="grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        {/* ── Overview ─────────────────────────────────────────── */}
        <div className="flex min-w-0 flex-col">
          <div className="relative aspect-[21/9] w-full overflow-hidden bg-gradient-to-br from-[#1a3d5c] via-[#12304a] to-[#0b2136]">
            <RemoteImage
              src={course.image}
              alt={course.title}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover"
              fallback={<GraduationCap className="absolute inset-0 m-auto size-12 text-primary" />}
            />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" />
            <span className="absolute left-4 top-4 rounded-full bg-[#12304a]/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#f6efe0] backdrop-blur">
              {course.category}
            </span>
            <span className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-sm font-bold text-[#0b2136] shadow">
              {course.price > 0 ? `${course.price.toLocaleString()} RWF` : t("m_elearning.free")}
            </span>
          </div>

          <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
            <h2 className="font-cinzel text-xl font-bold leading-snug text-[#12304a] dark:text-[#f6efe0] sm:text-2xl">{course.title}</h2>
            {course.instructor && course.instructor !== "Unassigned" && (
              <p className="text-sm text-muted-foreground">
                {t("m_elearning.by")} <span className="font-semibold text-foreground">{course.instructor}</span>
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              {lessonCount > 0 && <span className="inline-flex items-center gap-1.5"><BookOpenText className="size-4 text-primary" /> {fill("m_elearning.n_lessons", { n: lessonCount })}</span>}
              {totalMinutes > 0 && <span className="inline-flex items-center gap-1.5"><Clock className="size-4 text-primary" /> {formatMinutes(totalMinutes)}</span>}
              {course.students > 0 && <span className="inline-flex items-center gap-1.5"><Users className="size-4 text-primary" /> {fill("m_elearning.learners", { n: course.students })}</span>}
              {rating > 0 && <span className="inline-flex items-center gap-1.5"><Star className="size-4 fill-primary text-primary" /> {rating.toFixed(1)}</span>}
            </div>
            {course.description && <p className="line-clamp-4 text-sm leading-relaxed text-foreground/80">{course.description}</p>}

          </div>
        </div>

        {/* ── Lessons + enroll ─────────────────────────────────── */}
        <div className="flex min-w-0 flex-col gap-4 border-t border-border bg-muted/40 p-5 sm:p-6 lg:border-l lg:border-t-0">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-base font-bold">{t("m_elearning.course_content")}</h3>
            {totalMinutes > 0 && <span className="text-xs text-muted-foreground">{formatMinutes(totalMinutes)}</span>}
          </div>

          {lessons.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">{t("m_elearning.no_lessons_yet")}</p>
          ) : (
            <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {lessons.slice(0, PREVIEW_LESSONS).map((lesson, i) => {
                const Icon = LESSON_ICON[lesson.contentType] ?? FileText;
                return (
                  <li key={lesson.id} className="flex items-center gap-3 px-3 py-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#12304a] text-xs font-bold text-[#f6efe0] dark:bg-primary dark:text-[#0b2136]">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm" title={lesson.title}>{lesson.title}</span>
                    {freeLessons > 0 && lesson.access === "FREE" && (
                      <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-[#a07830] dark:text-primary">{t("m_elearning.free_lesson")}</span>
                    )}
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <Icon className="size-3.5" />
                      {lesson.durationMinutes > 0 && formatMinutes(lesson.durationMinutes)}
                    </span>
                  </li>
                );
              })}
              {lessons.length > PREVIEW_LESSONS && (
                <li className="px-3 py-2.5 text-center text-sm font-semibold text-muted-foreground">
                  {fill("m_elearning.more_lessons", { n: lessons.length - PREVIEW_LESSONS })}
                </li>
              )}
            </ol>
          )}

          {/* What the course includes */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("m_elearning.includes")}</p>
            <ul className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              {includes.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2 text-sm">
                  <Icon className="size-4 shrink-0 text-[#12304a] dark:text-primary" /> {text}
                </li>
              ))}
            </ul>
          </div>

          {/* Call to action */}
          <div className="mt-auto flex flex-col gap-2 pt-2">
            {enrolled ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-border">
                    <span className="block h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">{fill("m_elearning.progress", { n: progress })}</span>
                </div>
                <Link
                  href={`/member/courses/${course.id}`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#12304a] px-6 text-sm font-bold text-[#f6efe0] shadow transition hover:bg-[#1a3d5c] dark:bg-primary dark:text-[#0b2136] dark:hover:bg-primary/90"
                >
                  <CheckCircle2 className="size-4" /> {t("m_elearning.continue")}
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onEnroll}
                  disabled={enrolling}
                  aria-label={`${course.price > 0 ? fill("m_elearning.enroll_pay", { price: course.price.toLocaleString() }) : t("m_elearning.enroll_free")}: ${course.title}`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-[#0b2136] shadow transition hover:bg-primary/90 disabled:opacity-70"
                >
                  {enrolling ? <><Loader2 className="size-4 animate-spin" /> {t("m_elearning.enrolling")}</>
                    : course.price > 0 ? fill("m_elearning.enroll_pay", { price: course.price.toLocaleString() })
                    : t("m_elearning.enroll_free")}
                </button>
                {freeLessons > 0 && (
                  // Opening the course enrolls the member for free; paid lessons stay locked until paid.
                  <Link
                    href={`/member/courses/${course.id}`}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-[#12304a]/30 text-sm font-semibold text-[#12304a] transition hover:bg-[#12304a]/5 dark:border-primary/40 dark:text-primary"
                  >
                    {t("m_pay.start_free")} · {fill("m_pay.free_lessons", { n: freeLessons })}
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
