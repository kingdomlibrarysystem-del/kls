import { ShieldAlert } from 'lucide-react'

/** Shown instead of a publishing page when the signed-in role lacks the permission it needs. */
export function NoPermission({ permissionLabel }: { permissionLabel: string }) {
  return (
    <div className="flex max-w-xl items-start gap-3 rounded-xl border border-border bg-card p-5 shadow-xs">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning"><ShieldAlert className="size-5" /></span>
      <div>
        <p className="text-sm font-semibold text-foreground">Your role can&apos;t use this page</p>
        <p className="mt-1 text-sm text-muted-foreground">
          It needs the <span className="font-semibold text-foreground">{permissionLabel}</span> permission. An admin can grant it to your role in
          Platform Management → Roles &amp; Permissions.
        </p>
      </div>
    </div>
  )
}
