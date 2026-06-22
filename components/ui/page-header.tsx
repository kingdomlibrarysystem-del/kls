interface PageHeaderProps {
  title: string
  subtitle?: string
  className?: string
}

export function PageHeader({ title, subtitle, className }: PageHeaderProps) {
  return (
    <div className={`mb-8 ${className ?? ''}`}>
      <h1
        className="font-cinzel text-2xl font-semibold text-w-950 mb-2"
        style={{ letterSpacing: '1.5px' }}
      >
        {title}
      </h1>
      {subtitle && (
        <p className="font-lato text-w-700" style={{ letterSpacing: '0.3px' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
