import React from 'react'
import { cn } from '@/lib/utils'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

/**
 * Form text input styled with the shadcn Input tokens (border-input,
 * ring, destructive) so it follows light/dark mode. Stays a plain
 * forwardRef <input> so react-hook-form's `register()` keeps working.
 */
export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          aria-invalid={error ? true : undefined}
          className={cn(
            'w-full px-4 py-3 font-lato text-sm rounded-lg border bg-form-bg text-foreground shadow-xs transition-[color,box-shadow,border-color] outline-none',
            'placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
            'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 focus:bg-form-highlight',
            'dark:bg-input/30 dark:focus:bg-input/40',
            error
              ? 'border-destructive bg-destructive/5 focus-visible:ring-destructive/20'
              : 'border-input',
            className,
          )}
          style={{ letterSpacing: '0.3px' }}
          {...props}
        />
        {error && <p className="text-destructive text-xs mt-1 font-lato">{error}</p>}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'
