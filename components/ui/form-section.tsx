interface FormSectionProps {
  title?: string
  children: React.ReactNode
}

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <div className="bg-form-section dark:bg-secondary/60 border border-border rounded-xl p-6 mb-6 shadow-xs">
      {title && (
        <h3 className="font-cinzel text-lg font-semibold text-w-900 dark:text-foreground mb-4">
          {title}
        </h3>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  )
}
