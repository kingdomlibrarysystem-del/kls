import { NewsFeedView } from './_components/news-feed-view'

export default function MemberNewsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Cinzel',serif" }}>
          News &amp; Newspapers
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          Newsletters, articles, and newspaper editions 
        </div>
      </div>
      <NewsFeedView />
    </div>
  )
}