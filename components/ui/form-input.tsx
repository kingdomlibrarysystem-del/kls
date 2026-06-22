import React from 'react'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={`w-full px-4 py-3 font-lato text-sm border rounded transition-colors ${
            error
              ? 'border-red-500 bg-red-50'
              : 'border-w-500 bg-form-bg focus:bg-form-highlight focus:border-w-600'
          } focus:outline-none ${className}`}
          style={{ letterSpacing: '0.3px' }}
          {...props}
        />
        {error && <p className="text-red-600 text-xs mt-1 font-lato">{error}</p>}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'
