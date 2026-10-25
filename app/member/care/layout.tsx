import { CareNav } from './_components/care-nav'

/** Care & Support (Counseling + Rehabilitation) for members. */
export default function CareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-3">
        <h1 className="font-cinzel text-2xl font-bold text-foreground">Care &amp; Support</h1>
        <p className="mt-1 text-sm text-muted-foreground">Guidance, encouragement and someone to talk to — confidential and at your own pace.</p>
      </div>
      <CareNav />
      {children}
    </div>
  )
}
