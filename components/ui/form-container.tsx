interface FormContainerProps {
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg'
}

export function FormContainer({
  children,
  maxWidth = 'md',
}: FormContainerProps) {
  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }

  return (
    <div className={`mx-auto ${maxWidthClass[maxWidth]} bg-form-highlight dark:bg-card border border-border rounded-xl p-8 shadow-sm`}>
      {children}
    </div>
  )
}
