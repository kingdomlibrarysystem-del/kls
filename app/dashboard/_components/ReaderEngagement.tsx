import Link from "next/link";
import { Newspaper, BookOpen, Eye, MessageCircle, ThumbsUp } from "lucide-react";
import { SectionCard, SectionLink } from "./section-card";
import type { AdminDashboardData } from "@/lib/data/admin-dashboard";

type Engagement = AdminDashboardData["engagement"];

function Total({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground [&_svg]:size-3.5">{icon} {label}</p>
      <p suppressHydrationWarning className="mt-1 font-cinzel text-xl font-bold leading-none text-foreground">{value.toLocaleString()}</p>
    </div>
  );
}

function Count({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground [&_svg]:size-3.5" title={`${value} ${label}`}>
      {icon} <span suppressHydrationWarning className="font-semibold text-foreground">{value.toLocaleString()}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

function Row({ href, title, children }: { href: string; title: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted">
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{title}</span>
      <span className="flex shrink-0 items-center gap-3">{children}</span>
    </Link>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>;
}

/**
 * How readers engage with news articles and with books: total views and
 * comments, and the five most viewed of each. All numbers are aggregated on
 * the server (getReaderEngagement) — a view is one person/device per item.
 */
export function ArticleEngagementCard({ articles }: { articles: Engagement["articles"] }) {
  return (
    <SectionCard
      icon={<Newspaper />}
      title="News & Newsletters — Readers"
      description="Views, likes and comments on articles and editions."
      footer={<SectionLink href="/dashboard/news/engagement">Comments & reactions</SectionLink>}
      contentClassName="px-3"
    >
      <div className="grid grid-cols-3 gap-2 px-2">
        <Total icon={<Eye />} label="Views" value={articles.views} />
        <Total icon={<MessageCircle />} label="Comments" value={articles.comments} />
        <Total icon={<ThumbsUp />} label="Likes" value={articles.likes} />
      </div>
      <p className="mt-4 px-2 text-[11px] font-semibold tracking-widest text-muted-foreground">MOST VIEWED</p>
      {articles.top.length === 0 ? (
        <EmptyLine>No article has been viewed yet.</EmptyLine>
      ) : (
        <div className="divide-y divide-border">
          {articles.top.map((a) => (
            <Row key={a.id} href={`/dashboard/news/articles/${a.id}`} title={a.title}>
              <Count icon={<Eye />} value={a.views} label="views" />
              <Count icon={<ThumbsUp />} value={a.likes} label="likes" />
              <Count icon={<MessageCircle />} value={a.comments} label="comments" />
            </Row>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export function BookEngagementCard({ books }: { books: Engagement["books"] }) {
  return (
    <SectionCard
      icon={<BookOpen />}
      title="Books — Readers"
      description="Views and member reviews on library books."
      footer={<SectionLink href="/dashboard/library">Book inventory</SectionLink>}
      contentClassName="px-3"
    >
      <div className="grid grid-cols-2 gap-2 px-2">
        <Total icon={<Eye />} label="Views" value={books.views} />
        <Total icon={<MessageCircle />} label="Reviews" value={books.reviews} />
      </div>
      <p className="mt-4 px-2 text-[11px] font-semibold tracking-widest text-muted-foreground">MOST VIEWED</p>
      {books.top.length === 0 ? (
        <EmptyLine>No book has been viewed yet.</EmptyLine>
      ) : (
        <div className="divide-y divide-border">
          {books.top.map((b) => (
            <Row key={b.id} href={`/dashboard/library/${b.id}`} title={b.title}>
              <Count icon={<Eye />} value={b.views} label="views" />
              <Count icon={<MessageCircle />} value={b.reviews} label="reviews" />
            </Row>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
