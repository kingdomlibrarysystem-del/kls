export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block font-lato text-xs font-semibold text-w-700 dark:text-white/60 uppercase tracking-wider mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

export function inputCls(hasError?: boolean) {
  return `w-full px-3 py-2 font-lato text-sm border rounded focus:outline-none transition-colors
    bg-white dark:bg-white/5 text-w-950 dark:text-white
    placeholder:text-w-400 dark:placeholder:text-white/30
    ${hasError
      ? 'border-red-400 focus:border-red-500'
      : 'border-w-400 dark:border-white/10 focus:border-w-600 dark:focus:border-w-600'
    }`
}
