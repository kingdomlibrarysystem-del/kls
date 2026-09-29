import { Label } from '@/components/ui/label'

interface FieldLabelProps {
  htmlFor: string
  children: React.ReactNode
  required?: boolean
}

export function FieldLabel({ htmlFor, children, required }: FieldLabelProps) {
  return (
    <Label
      htmlFor={htmlFor}
      className="flex text-sm font-lato font-normal text-foreground mb-2 gap-0"
      style={{ letterSpacing: '0.5px' }}
    >
      {children}
      {required && <span className="text-primary ml-1">*</span>}
    </Label>
  )
}
