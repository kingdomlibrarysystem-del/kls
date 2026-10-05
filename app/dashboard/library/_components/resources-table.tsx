import Image from "next/image";
import Link from "next/link";
import { Eye, Pencil, Archive, BookOpenCheck, Package, MessageCircle } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/data-table";
import { UniversalButton } from "@/components/ui/universal-button";
import { getCategoryById } from "@/lib/kcs-taxonomy";
import {
  statusConfig,
  bindingTypeLabels,
  isResourceReadable,
  type Resource,
} from "./resources-data";
import { useMediaTypes } from "@/lib/client/use-media-types";
import { mediaCapabilities, mediaTypeName } from "@/lib/media-types-shared";

interface ResourcesTableProps {
  data: Resource[];
  statusFilter: Resource["status"] | "all";
  typeFilter: string;
  onStatusFilterChange: (value: Resource["status"] | "all") => void;
  onTypeFilterChange: (value: string) => void;
  onEdit: (resource: Resource) => void;
  onArchive: (resource: Resource) => void;
}

/** DataTable of library resources with View/Edit/Archive row actions and status/type filters. */
export function ResourcesTable({
  data,
  statusFilter,
  typeFilter,
  onStatusFilterChange,
  onTypeFilterChange,
  onEdit,
  onArchive,
}: ResourcesTableProps) {
  const { mediaTypes } = useMediaTypes();
  const tableData = data.filter((r) => {
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchType =
      typeFilter === "all" || r.type.toLowerCase() === typeFilter;
    return matchStatus && matchType;
  });

  const types = [
    "all",
    ...Array.from(new Set(data.map((r) => r.type.toLowerCase()))),
  ];

  const columns: Column<Resource>[] = [
    {
      key: "title",
      label: "Resource",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-12 shrink-0 rounded overflow-hidden bg-w-200 dark:bg-white/10">
            {r.coverImages[0] ? (
              <Image
                src={r.coverImages[0]}
                alt={r.title}
                fill
                sizes="36px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-0.5">
                <Package size={14} className="text-w-400 dark:text-muted-foreground" />
                <span className="font-lato text-[8px] font-semibold text-w-500 uppercase tracking-wide leading-none">Kingdom Library</span>
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-w-950 max-w-45 truncate">
              {r.title}
            </p>
            <p className="text-xs text-w-600">{r.author}</p>
          </div>
        </div>
      ),
    },
    {
      key: "categoryId",
      label: "KCS Section",
      sortable: true,
      render: (r) => {
        const category = getCategoryById(r.categoryId);
        const rootCode = category
          ? getCategoryById(category.parentId ?? "")?.code
          : undefined;
        return (
          <div>
            <p>{category?.name.en ?? "Uncategorized"}</p>
            {rootCode && (
              <span className="inline-block px-1.5 py-0.5 bg-w-100 text-w-700 rounded text-xs font-mono font-semibold mt-0.5">
                {rootCode}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "language",
      label: "Lang",
      sortable: true,
      render: (r) => (
        <span className="px-2 py-0.5 bg-w-100 text-w-950 rounded text-xs font-lato">
          {r.language}
        </span>
      ),
    },
    {
      key: "bindingType",
      label: "Binding / Media",
      sortable: true,
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          <span className="px-1.5 py-0.5 bg-w-100 text-w-700 rounded text-xs font-lato">
            {bindingTypeLabels[r.bindingType]}
          </span>
          <span className="px-1.5 py-0.5 bg-w-100 text-w-700 rounded text-xs font-lato">
            {mediaTypeName(r.mediaType, mediaTypes)}
          </span>
        </div>
      ),
    },
    {
      key: "availableQty",
      label: "Stock",
      sortable: true,
      render: (r) => (
        <div>
          <p
            className={`font-semibold ${r.availableQty === 0 ? "text-red-700" : "text-green-700 dark:text-success"}`}
          >
            {r.availableQty} / {r.totalQty}
          </p>
          <p className="text-xs text-w-600">available / total</p>
        </div>
      ),
    },
    {
      key: "views",
      label: "Views / Reviews",
      sortable: true,
      render: (r) => (
        <div className="flex flex-col gap-0.5 text-xs font-lato text-w-700 dark:text-muted-foreground whitespace-nowrap">
          <span className="inline-flex items-center gap-1" title="Unique viewers"><Eye size={12} /> <span suppressHydrationWarning>{(r.views ?? 0).toLocaleString()}</span></span>
          <span className="inline-flex items-center gap-1" title="Member reviews"><MessageCircle size={12} /> {r.reviewCount}</span>
        </div>
      ),
    },
    {
      key: "price",
      label: "Price",
      sortable: true,
      render: (r) => (
        <span className="font-cinzel text-sm font-semibold text-w-600">
          {r.price.toLocaleString()} RWF
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (r) => (
        <span
          className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${statusConfig[r.status].cls}`}
        >
          {statusConfig[r.status].label}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          {isResourceReadable(r) ? (
            <Link
              href={`/dashboard/library/read/${r.id}`}
              aria-label={`Read ${r.title}`}
              className="flex items-center gap-1 px-2.5 py-1 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 dark:hover:bg-white/10 transition-colors"
            >
              <BookOpenCheck size={12} /> Read
            </Link>
          ) : mediaCapabilities(r.mediaType, mediaTypes).allowsChapters ? (
            <span
              title="No chapters yet — edit this book and add chapters to make it readable"
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-warning/10 text-amber-700 dark:text-warning border border-amber-200 dark:border-warning/30 rounded text-xs font-lato cursor-help"
            >
              <BookOpenCheck size={12} /> No chapters
            </span>
          ) : null}
          {isResourceReadable(r) && r.price > 0 && (
            <Link
              href={`/dashboard/library/read/${r.id}?preview=1`}
              aria-label={`Preview ${r.title} as a member would see it`}
              className="flex items-center gap-1 px-2.5 py-1 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 dark:hover:bg-white/10 transition-colors"
            >
              <Eye size={12} /> Preview
            </Link>
          )}
          <UniversalButton
            href={`/dashboard/library/${r.id}`}
            variant="outline"
            size="sm"
            aria-label={`View ${r.title}`}
            icon={<Eye size={12} />}
            className="!px-2.5 !py-1 bg-w-100 text-w-950 border-w-300 hover:bg-w-200 dark:hover:bg-white/10"
          >
            View
          </UniversalButton>
          <button
            onClick={() => onEdit(r)}
            aria-label={`Edit ${r.title}`}
            className="flex items-center gap-1 px-2.5 py-1 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 dark:hover:bg-white/10 transition-colors"
          >
            <Pencil size={12} /> Edit
          </button>
          {r.status !== "archived" && (
            <button
              onClick={() => onArchive(r)}
              aria-label={`Archive ${r.title}`}
              className="flex items-center gap-1 px-2.5 py-1 bg-red-50 dark:bg-destructive/10 text-red-700 dark:text-destructive border border-red-200 dark:border-destructive/30 rounded text-xs font-lato hover:bg-red-100 dark:hover:bg-destructive/20 transition-colors"
            >
              <Archive size={12} /> Archive
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable<Resource>
      data={tableData}
      columns={columns}
      rowKey={(r) => r.id}
      searchPlaceholder="Search title, author, ISBN..."
      searchFilter={(r, q) =>
        r.title.toLowerCase().includes(q) ||
        r.author.toLowerCase().includes(q) ||
        r.isbn.includes(q) ||
        (getCategoryById(r.categoryId)?.name.en.toLowerCase().includes(q) ??
          false)
      }
      filters={
        <>
          <select
            value={statusFilter}
            onChange={(e) =>
              onStatusFilterChange(e.target.value as Resource["status"] | "all")
            }
            className="px-3 py-2 font-lato text-sm border border-w-400 bg-white dark:bg-card! rounded focus:border-w-600 dark:focus:border-primary focus:outline-none"
          >
            <option value="all">All Statuses</option>
            {(Object.keys(statusConfig) as Resource["status"][]).map((s) => (
              <option key={s} value={s}>
                {statusConfig[s].label}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value)}
            className="px-3 py-2 font-lato text-sm border border-w-400 bg-white dark:bg-card! rounded focus:border-w-600 dark:focus:border-primary focus:outline-none"
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t === "all"
                  ? "All Types"
                  : t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </>
      }
      emptyMessage="No resources match your filters."
    />
  );
}
