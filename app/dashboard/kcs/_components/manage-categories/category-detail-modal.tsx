import { FolderOpen, Hash, Layers, Calendar, Globe } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { getParentName, resourceCountFor, type Category } from '@/lib/kcs-taxonomy'
import type { Resource } from '@/app/dashboard/library/_components/resources-data'

interface CategoryDetailModalProps {
  category: Category | null
  resources: Resource[]
  onClose: () => void
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-20 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium">{value}</span>
    </div>
  )
}

/** Read-only details view for a single category, including its multilingual names. Resource count is computed live. */
export function CategoryDetailModal({ category, resources, onClose }: CategoryDetailModalProps) {
  return (
    <Modal open={!!category} onClose={onClose} title="Category Details" size="md">
      {category && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-w-100 flex items-center justify-center shrink-0">
              <FolderOpen size={18} className="text-w-600" />
            </div>
            <div>
              <h3 className="font-cinzel text-base font-semibold text-w-950">{category.name.en}</h3>
              <p className="font-lato text-xs text-w-600">{getParentName(category) ?? 'Root category'}</p>
            </div>
          </div>

          <div className="bg-form-highlight border border-w-300 rounded p-3 space-y-2">
            <DetailRow icon={<Hash size={13} />} label="Slug" value={category.slug} />
            <DetailRow icon={<Globe size={13} />} label="Français" value={category.name.fr} />
            <DetailRow icon={<Globe size={13} />} label="Kinyarwanda" value={category.name.rw} />
            <DetailRow icon={<Layers size={13} />} label="Resources" value={String(resourceCountFor(category.id, resources))} />
            <DetailRow icon={<Calendar size={13} />} label="Created" value={category.createdAt} />
          </div>
        </div>
      )}
    </Modal>
  )
}
