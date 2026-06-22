interface SectionHeaderProps {
  children: React.ReactNode
  className?: string
}

export function SectionHeader({ children, className = '' }: SectionHeaderProps) {
  return (
    <h2
      className={`font-cinzel text-2xl font-semibold text-w-950 mb-6 ${className}`}
      style={{ letterSpacing: '1px' }}
    >
      {children}
    </h2>
  )
}
