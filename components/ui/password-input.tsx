import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: string
}

/**
 * FormInput-styled password field with a real show/hide toggle — same
 * markup/classes as components/ui/form-input.tsx so it drops in wherever
 * a plain `<FormInput type="password" />` was used, just with a real eye
 * icon button instead of always-masked text.
 */
export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ error, className = '', ...props }, ref) => {
    const [visible, setVisible] = useState(false)

    return (
      <div className="w-full">
        <div className="relative">
          <input
            ref={ref}
            type={visible ? 'text' : 'password'}
            className={`w-full px-4 py-3 pr-11 font-lato text-sm border rounded transition-colors ${
              error
                ? 'border-red-500 bg-red-50'
                : 'border-w-500 bg-form-bg focus:bg-form-highlight focus:border-w-600'
            } focus:outline-none ${className}`}
            style={{ letterSpacing: '0.3px' }}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="absolute right-0 top-0 h-full px-3 flex items-center text-w-600 hover:text-w-800"
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {error && <p className="text-red-600 text-xs mt-1 font-lato">{error}</p>}
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'
