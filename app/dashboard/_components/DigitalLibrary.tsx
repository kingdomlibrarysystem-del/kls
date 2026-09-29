import Link from "next/link";
import {
  ScrollText,
  History,
  Lightbulb,
  Radio,
  Heart,
  Rocket,
  BookCopy,
  Eye,
  Feather,
  BookOpen,
  Search,
} from "lucide-react";
import { SectionCard, SectionLink } from "./section-card";

const kcsSections = [
  { icon: <ScrollText />, code: "KCS-FND", label: "Foundation", desc: "Constitution of the Kingdom — Origins, Laws, Covenant", color: "var(--card-accent-1)" },
  { icon: <History />, code: "KCS-HIS", label: "History", desc: "Record of the Kingdom — Leadership, Patterns, Restorations", color: "var(--card-accent-2)" },
  { icon: <Lightbulb />, code: "KCS-WIS", label: "Wisdom", desc: "Knowledge of the Kingdom — Life, Health, Prosperity", color: "var(--card-accent-3)" },
  { icon: <Radio />, code: "KCS-PRP", label: "Prophetic", desc: "Voice of the Kingdom — Correction, Promises, Hope", color: "var(--card-accent-1)" },
  { icon: <Heart />, code: "KCS-GOS", label: "Gospel", desc: "King's Manifestation — Nature, Authority, Model", color: "var(--card-accent-2)" },
  { icon: <Rocket />, code: "KCS-ACT", label: "Acts", desc: "Kingdom Expansion — Birth, Power, Community", color: "var(--card-accent-3)" },
  { icon: <BookCopy />, code: "KCS-EPI", label: "Epistles", desc: "Kingdom Explained — Identity, Conduct, Structure", color: "var(--card-accent-1)" },
  { icon: <Eye />, code: "KCS-REV", label: "Revelation", desc: "Kingdom Destiny — Throne, Judgment, Eternal", color: "var(--card-accent-2)" },
];

const tile = "flex items-center gap-3 rounded-lg border border-border bg-muted/60 p-3 transition-colors hover:border-primary/40 hover:bg-muted";

/** The 8 KCS pillars as an even 4-column grid (2 on small screens), plus the Your Scroll / Search shortcuts. */
export default function DigitalLibrary() {
  return (
    <SectionCard
      icon={<BookOpen />}
      title="Kingdom Library — KCS Classification"
      description="The Bible is not one book — it is a library. Navigate by section to find truth with purpose."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs italic text-muted-foreground">Navigation replaces memorization — visit the right scrolls at the right time.</p>
          <SectionLink href="/dashboard/library/kcs">Open KCS Map</SectionLink>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kcsSections.map((s) => (
          <Link
            key={s.code}
            href="/dashboard/library/kcs"
            className="group flex flex-col rounded-lg border border-border p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
            style={{ background: s.color }}
          >
            <div className="flex items-center gap-2 text-primary [&_svg]:size-4">
              {s.icon}
              <span className="text-[11px] font-bold tracking-wide">{s.code}</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-foreground">{s.label}</p>
            <p className="mt-1 text-xs leading-snug text-muted-foreground">{s.desc}</p>
          </Link>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link href="/dashboard/library/kcs" className={tile}>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Feather className="size-4" /></span>
          <span>
            <span className="block text-sm font-semibold text-foreground">Your Scroll</span>
            <span className="block text-xs text-muted-foreground">Add your Acts &amp; Epistles</span>
          </span>
        </Link>
        <Link href="/dashboard/library" className={tile}>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Search className="size-4" /></span>
          <span>
            <span className="block text-sm font-semibold text-foreground">Search</span>
            <span className="block text-xs text-muted-foreground">Navigate the library</span>
          </span>
        </Link>
      </div>
    </SectionCard>
  );
}
