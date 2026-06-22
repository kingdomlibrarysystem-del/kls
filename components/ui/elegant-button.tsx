import React from 'react'

interface ElegantButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  fullWidth?: boolean
  loading?: boolean
}

export const ElegantButton = React.forwardRef<
  HTMLButtonElement,
  ElegantButtonProps
>(
  (
    {
      variant = 'primary',
      fullWidth = false,
      loading = false,
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      primary:
        'bg-w-600 text-white hover:bg-w-700 active:bg-w-800 border border-w-700',
      secondary:
        'bg-w-400 text-w-950 hover:bg-w-500 active:bg-w-600 border border-w-500',
      outline:
        'bg-transparent text-w-600 hover:bg-w-50 active:bg-w-100 border border-w-600',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          px-6 py-3 font-lato text-sm font-normal rounded
          transition-all duration-200 ease-in-out
          disabled:opacity-60 disabled:cursor-not-allowed
          ${variantClasses[variant]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        style={{ letterSpacing: '0.5px' }}
        {...props}
      >
        {loading ? 'Loading...' : children}
      </button>
    )
  }
)

ElegantButton.displayName = 'ElegantButton'
