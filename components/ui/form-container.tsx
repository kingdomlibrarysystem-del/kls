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
    <div className={`mx-auto ${maxWidthClass[maxWidth]} bg-form-highlight border border-w-300 rounded-lg p-8`}>
      {children}
    </div>
  )
}
