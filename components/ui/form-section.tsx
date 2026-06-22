interface FormSectionProps {
  title?: string
  children: React.ReactNode
}

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <div className="bg-form-section border border-w-400 rounded-lg p-6 mb-6">
      {title && (
        <h3 className="font-cinzel text-lg font-semibold text-w-900 mb-4">
          {title}
        </h3>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  )
}
