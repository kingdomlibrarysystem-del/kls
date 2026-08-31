"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ElegantButton } from "@/components/ui/elegant-button";
import { useCategories } from "@/lib/kcs-taxonomy/use-categories";
import { type Resource } from "./resources-data";
import {
  resourceSchema,
  defaultResourceFormValues,
  type ResourceFormData,
} from "./resource-form-schema";
import { ResourceFormBasics } from "./resource-form-basics";
import { ResourceFormDetails } from "./resource-form-details";

interface ResourceFormModalProps {
  open: boolean;
  /** Row being edited, or null when creating a new resource. */
  editing: Resource | null;
  onClose: () => void;
  onSave: (data: ResourceFormData, editingId: string | null) => void;
}

/** Create/Edit modal for a digital library resource — covers the full canonical Resource shape the Detail modal already displays. */
export function ResourceFormModal({
  open,
  editing,
  onClose,
  onSave,
}: ResourceFormModalProps) {
  const [submitError, setSubmitError] = useState("");
  const { data: allCategories } = useCategories();
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
    formState: { errors },
  } = useForm<ResourceFormData>({
    resolver: zodResolver(resourceSchema),
    defaultValues: defaultResourceFormValues,
  });

  useEffect(() => {
    if (open) {
      reset(
        editing
          ? {
              title: editing.title,
              author: editing.author,
              categoryId: editing.categoryId,
              totalQty: editing.totalQty,
              description: editing.description,
              publisher: editing.publisher,
              language: editing.language,
              pages: editing.pages,
              price: editing.price,
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
            }
          : {
              ...defaultResourceFormValues,
              categoryId: leafCategories[0]?.id ?? "",
            },
      );
      setSubmitError("");
    }
    // leafCategories.length: re-run once real categories have loaded, so a
    // new resource's default categoryId isn't silently stuck at "" from
    // opening the modal before the categories fetch resolved.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, reset, leafCategories.length]);

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
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded font-lato text-xs">
            <AlertCircle size={13} /> {submitError}
          </div>
        )}

        {!editing && (
          <p className="font-lato text-xs text-w-600 bg-w-50 border border-w-200 rounded px-3 py-2">
            A unique ISBN is generated automatically once you save — there&apos;s no ISBN field to fill in.
          </p>
        )}

        <ResourceFormBasics
          register={register}
          errors={errors}
          leafCategories={leafCategories}
          rootCategories={rootCategories}
          setValue={setValue}
          categoryId={watch('categoryId')}
        />

        <ResourceFormDetails
          register={register}
          control={control}
          errors={errors}
          setValue={setValue}
          watch={watch}
          isCreating={!editing}
        />

        <div className="flex gap-2 pt-2">
          <ElegantButton
            type="submit"
            variant="primary"
            className="flex-1 text-sm py-2"
          >
            {editing ? "Save Changes" : "Add Resource"}
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
