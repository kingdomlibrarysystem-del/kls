"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, FileClock } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ElegantButton } from "@/components/ui/elegant-button";
import { useCategories } from "@/lib/kcs-taxonomy/use-categories";
import { useMediaTypes } from "@/lib/client/use-media-types";
import { mediaCapabilities } from "@/lib/media-types-shared";
import { suggestCollection } from "@/lib/klp-code";
import type { CollectionOption } from "@/lib/data/klp-register";
import { type Resource } from "./resources-data";
import {
  resourceSchema,
  defaultResourceFormValues,
  type ResourceFormData,
} from "./resource-form-schema";
import { ResourceFormBasics } from "./resource-form-basics";
import { ResourceFormDetails } from "./resource-form-details";
import { ResourceFormPublicationCode } from "./resource-form-publication-code";

interface ResourceFormModalProps {
  open: boolean;
  /** Row being edited, or null when creating a new resource. */
  editing: Resource | null;
  /** KLP collections (admin-managed), for the publication-code section. */
  collections: CollectionOption[];
  onClose: () => void;
  onSave: (data: ResourceFormData, editingId: string | null) => void;
}

/** The edited resource as form values (chapters loaded separately for chapter-based media types). */
function valuesFrom(editing: Resource, chapters: ResourceFormData["chapters"]): ResourceFormData {
  return {
    title: editing.title,
    author: editing.author,
    categoryId: editing.categoryId,
    totalQty: editing.totalQty,
    description: editing.description,
    publisher: editing.publisher,
    language: editing.language,
    pages: editing.pages,
    price: editing.price,
    borrowPrice: editing.borrowPrice ?? 0,
    borrowDurationDays: editing.borrowDurationDays ?? 14,
    freePreviewChapterCount: editing.freePreviewChapterCount ?? 0,
    bindingType: editing.bindingType,
    mediaType: editing.mediaType,
    tags: editing.tags,
    coverImage: editing.coverImages[0] ?? "",
    documentUrl: editing.documentUrl ?? "",
    documentName: "",
    audioUrl: editing.audioUrl ?? "",
    audioName: "",
    videoUrl: editing.videoUrl ?? "",
    videoName: "",
    chapters,
    klpCollection: editing.klpCollection ?? "",
    klpEdition: editing.klpEdition ?? 1,
    klpFormat: editing.klpFormat ?? "",
    officialIsbn: editing.officialIsbn ?? "",
  };
}

/**
 * Create/Edit modal for a digital library resource. A new resource is saved
 * as a DRAFT — hidden from readers until an admin approves it, which is also
 * when its KLP Code and Kingdom Library ID are assigned.
 */
export function ResourceFormModal({
  open,
  editing,
  collections,
  onClose,
  onSave,
}: ResourceFormModalProps) {
  const [submitError, setSubmitError] = useState("");
  const [chapterLoadFailed, setChapterLoadFailed] = useState(false);
  const { data: allCategories } = useCategories();
  const { mediaTypes } = useMediaTypes();
  /** Whether the edited resource's (admin-managed) media type is chapter-based — replaces a hardcoded `mediaType === 'TEXT'`. */
  const editingHasChapters = !!editing && mediaCapabilities(editing.mediaType, mediaTypes).allowsChapters;
  const firstMediaTypeCode = mediaTypes[0]?.code ?? "";
  /**
   * Leaf/scroll-level categories only, grouped under their root pillar label
   * — a real cataloguer classifies a specific book (e.g. "Genesis"), not a
   * whole pillar, so the picker offers scrolls, not the 8 roots. Computed
   * from the live `useCategories()` result (not a module-scope snapshot of
   * the old static array), since the taxonomy is now fetched, not seeded.
   */
  const leafCategories = allCategories.filter((c) => c.parentId !== null);
  const rootCategories = allCategories.filter((c) => c.parentId === null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ResourceFormData>({
    resolver: zodResolver(resourceSchema),
    defaultValues: defaultResourceFormValues,
  });

  useEffect(() => {
    if (!open) return
    setChapterLoadFailed(false)

    if (editing && editingHasChapters) {
      fetch(`/api/chapters?resourceId=${editing.id}`)
        .then((r) => r.json())
        .then((json) => {
          const chapters: { title: string; body?: string }[] = json.data?.chapters ?? []
          setChapterLoadFailed(false)
          reset(valuesFrom(editing, chapters.map((c) => ({ title: c.title, content: c.body ?? '' }))))
        })
        .catch(() => {
          setChapterLoadFailed(true)
          setSubmitError('Could not load this book’s existing chapters. Close and reopen the editor before saving so no content is lost.')
          reset(valuesFrom(editing, []))
        })
      setSubmitError('')
      return
    }

    reset(
      editing
        ? valuesFrom(editing, [])
        : {
            ...defaultResourceFormValues,
            categoryId: leafCategories[0]?.id ?? "",
            mediaType: firstMediaTypeCode,
          },
    )
    setSubmitError("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, reset, leafCategories.length, editingHasChapters, firstMediaTypeCode])

  // Pre-select the KLP collection that matches the chosen category's pillar ("Foundation" → 01), until staff pick one themselves.
  const categoryId = watch("categoryId");
  useEffect(() => {
    if (!open || editing?.klpCode || getValues("klpCollection")) return
    const category = allCategories.find((c) => c.id === categoryId)
    const root = category?.parentId ? allCategories.find((c) => c.id === category.parentId) : category
    const code = suggestCollection(root?.name.en, collections)
    if (code) setValue("klpCollection", code)
  }, [open, editing, categoryId, allCategories, collections, getValues, setValue])

  const onSubmit = (data: ResourceFormData) => {
    try {
      onSave(data, editing?.id ?? null);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to save resource",
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? `Edit Resource: ${editing.title}` : "Add New Resource"}
      size="3xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {submitError && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-destructive/10 border border-red-200 dark:border-destructive/30 text-red-700 dark:text-destructive px-3 py-2 rounded font-lato text-xs">
            <AlertCircle size={13} /> {submitError}
          </div>
        )}

        {(!editing || editing.status === "draft") && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 font-lato text-xs text-amber-900 dark:border-warning/30 dark:bg-warning/10 dark:text-warning">
            <FileClock size={14} className="mt-0.5 shrink-0" />
            <span>
              {editing ? "This resource is a draft — " : "New resources are saved as a draft — "}
              readers can&apos;t see it until an admin approves it. The KLP Code and Kingdom Library ID are assigned on approval.
              {editing?.reviewNote && <><br /><strong>Note from the reviewer:</strong> {editing.reviewNote}</>}
            </span>
          </div>
        )}

        <ResourceFormBasics
          register={register}
          errors={errors}
          leafCategories={leafCategories}
          rootCategories={rootCategories}
          setValue={setValue}
          categoryId={categoryId}
        />

        <ResourceFormDetails
          register={register}
          control={control}
          errors={errors}
          setValue={setValue}
          watch={watch}
          isCreating={!editing}
        />

        <ResourceFormPublicationCode register={register} errors={errors} collections={collections} editing={editing} />

        <div className="flex gap-2 pt-2">
          <ElegantButton
            type="submit"
            variant="primary"
            className="flex-1 text-sm py-2"
            disabled={chapterLoadFailed}
          >
            {editing ? "Save Changes" : "Save as Draft"}
          </ElegantButton>
          <ElegantButton
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-sm py-2 px-4"
          >
            Cancel
          </ElegantButton>
        </div>
      </form>
    </Modal>
  );
}
