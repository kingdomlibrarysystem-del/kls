"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/modal";
import { FieldLabel } from "@/components/ui/field-label";
import { FormInput } from "@/components/ui/form-input";
import { ElegantButton } from "@/components/ui/elegant-button";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { useCourseCatalog } from "../../_shared/use-course-catalog";
import { addLesson } from "@/app/member/_shared/use-lessons";
import { LessonMediaUpload } from "./lesson-media-upload";
import {
  lessonSchema,
  contentTypeLabels,
  type LessonFormData,
} from "./lesson-form-schema";

interface AddLessonModalProps {
  open: boolean;
  onClose: () => void;
}

/** Create modal for a new lesson — appends to the real Lesson collection for the selected course. */
export function AddLessonModal({ open, onClose }: AddLessonModalProps) {
  const { data: courseCatalog } = useCourseCatalog();
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      courseId: courseCatalog[0]?.id ?? "",
      contentType: "VIDEO",
      durationMinutes: 10,
      content: "",
      contentMarkdown: "",
    },
  });

  const onSubmit = async (data: LessonFormData) => {
    try {
      const course = courseCatalog.find((c) => c.id === data.courseId);
      if (!course) throw new Error("Course not found");
      await addLesson(data.courseId, course.title, {
        title: data.title,
        contentType: data.contentType,
        durationMinutes: data.durationMinutes,
        content: data.content,
        contentMarkdown: data.contentMarkdown,
      });
      reset();
      onClose();
    } catch {
      // Real error surfaced via the lessons hook's own error state on next load.
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Lesson" size="5xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <FieldLabel htmlFor="add-lesson-course" required>
            Course
          </FieldLabel>
          <select
            id="add-lesson-course"
            className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none"
            {...register("courseId")}
          >
            {courseCatalog.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          {errors.courseId && (
            <p className="text-red-600 text-xs mt-1 font-lato">
              {errors.courseId.message}
            </p>
          )}
        </div>

        <div>
          <FieldLabel htmlFor="add-lesson-title" required>
            Lesson Title
          </FieldLabel>
          <FormInput
            id="add-lesson-title"
            type="text"
            error={errors.title?.message}
            {...register("title")}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="add-lesson-type" required>
              Content Type
            </FieldLabel>
            <select
              id="add-lesson-type"
              className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none"
              {...register("contentType")}
            >
              {(
                Object.keys(
                  contentTypeLabels,
                ) as (keyof typeof contentTypeLabels)[]
              ).map((t) => (
                <option key={t} value={t}>
                  {contentTypeLabels[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="add-lesson-duration" required>
              Duration (minutes)
            </FieldLabel>
            <FormInput
              id="add-lesson-duration"
              type="number"
              min={1}
              error={errors.durationMinutes?.message}
              {...register("durationMinutes", { valueAsNumber: true })}
            />
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="add-lesson-content" required>
            Summary
          </FieldLabel>
          <textarea
            id="add-lesson-content"
            rows={2}
            placeholder="Short summary shown in listings..."
            className={`w-full px-4 py-3 font-lato text-sm border rounded transition-colors focus:outline-none ${
              errors.content
                ? "border-red-500 bg-red-50"
                : "border-w-500 bg-form-bg focus:bg-form-highlight focus:border-w-600"
            }`}
            {...register("content")}
          />
          {errors.content && (
            <p className="text-red-600 text-xs mt-1 font-lato">
              {errors.content.message}
            </p>
          )}
        </div>

        <LessonMediaUpload
          contentType={watch("contentType")}
          onInsert={(markdownToAppend) =>
            setValue("contentMarkdown", `${getValues("contentMarkdown") ?? ""}${markdownToAppend}`, { shouldValidate: true })
          }
        />

        <div>
          <FieldLabel htmlFor="add-lesson-markdown" required>
            Lesson Content
          </FieldLabel>
          <Controller
            name="contentMarkdown"
            control={control}
            render={({ field }) => (
              <MarkdownEditor
                value={field.value ?? ""}
                onChange={field.onChange}
              />
            )}
          />
          {errors.contentMarkdown && (
            <p className="text-red-600 text-xs mt-1 font-lato">
              {errors.contentMarkdown.message}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <ElegantButton type="button" variant="outline" onClick={onClose}>
            Cancel
          </ElegantButton>
          <ElegantButton type="submit" variant="primary">
            Add Lesson
          </ElegantButton>
        </div>
      </form>
    </Modal>
  );
}
