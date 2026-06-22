interface FieldLabelProps {
  htmlFor: string
  children: React.ReactNode
  required?: boolean
}

export function FieldLabel({ htmlFor, children, required }: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-lato font-normal text-w-950 mb-2"
      style={{ letterSpacing: '0.5px' }}
    >
      {children}
      {required && <span className="text-amber-600 ml-1">*</span>}
    </label>
  )
}
