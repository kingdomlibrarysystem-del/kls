"use client";
import { TrendingUp, BookOpen, Award, Medal, Trophy } from "lucide-react";
import { useCertificates } from "@/app/dashboard/e-learning/certificates/_components/use-certificates";
import { useBorrowings } from "@/app/member/_shared/use-borrowings";

/** This mock has a single live member persona — see use-enrollments.ts's CURRENT_MEMBER_NAME. */
const CURRENT_MEMBER_NAME = "John Doe";

const medalColors = ["#D4AF37", "#A8A9AD", "#CD7F32"];
const medalIcons = [Trophy, Medal, Award];

/**
 * Real ranking derived from useCertificates() — courses completed is the
 * only metric this app tracks per-member across more than one persona
 * (certificates.member has 3 real distinct names in the seed data,
 * confirmed via direct read of certificates-data.ts). "Books read" has no
 * per-member field anywhere (Borrowing carries no member identity — it's
 * scoped to the single live "John Doe" persona only), so it's shown only
 * on the current member's own row rather than fabricated for everyone
 * else, matching DashboardStats.tsx's established precedent of leaving a
 * stat honestly absent (its "Payments" stat) rather than inventing a
 * number no store backs.
 */
function useRealRankings() {
  const certificates = useCertificates();
  const borrowings = useBorrowings();

  const byMember = new Map<string, number>();
  certificates.filter((c) => !c.revoked).forEach((c) => {
    byMember.set(c.member, (byMember.get(c.member) ?? 0) + 1);
  });
  if (!byMember.has(CURRENT_MEMBER_NAME)) byMember.set(CURRENT_MEMBER_NAME, 0);

  const booksRead = borrowings.filter((b) => b.status === "Returned").length;

  return Array.from(byMember.entries())
    .map(([name, coursesCompleted]) => ({
      name,
      coursesCompleted,
      booksRead: name === CURRENT_MEMBER_NAME ? booksRead : undefined,
      isYou: name === CURRENT_MEMBER_NAME,
    }))
    .sort((a, b) => b.coursesCompleted - a.coursesCompleted)
    .map((m, i) => ({ ...m, rank: i + 1 }));
}

export default function LeaderboardPage() {
  const ranked = useRealRankings();
  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Cinzel',serif" }}>
          Leaderboard
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          Ranked by real courses completed, from the shared certificates record
        </div>
      </div>

      {top3.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${top3.length}, 1fr)`, gap: 10 }}>
          {top3.map((m) => (
            <div key={m.name} style={{
              background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 12px", textAlign: "center",
              position: "relative", overflow: "hidden",
              transform: m.rank === 1 ? "scale(1.02)" : "none",
              borderColor: m.rank === 1 ? "var(--gold)" : m.rank === 2 ? "var(--text-muted)" : "var(--border)",
            }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
                {(() => { const MedalIcon = medalIcons[m.rank - 1]; return <MedalIcon size={28} color={medalColors[m.rank - 1]} />; })()}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
                {m.name}{m.isYou && " (You)"}
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 6 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--teal-light)" }}>{m.coursesCompleted}</div>
                  <div style={{ fontSize: 8, color: "var(--text-muted)" }}>Courses</div>
                </div>
                {typeof m.booksRead === "number" && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--gold)" }}>{m.booksRead}</div>
                    <div style={{ fontSize: 8, color: "var(--text-muted)" }}>Books</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
          <TrendingUp size={14} color="var(--gold)" /> Full Rankings
        </div>
        {ranked.map((m) => (
          <div key={m.name} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderBottom: "1px solid var(--border-light)",
            background: m.rank <= 3 ? "rgba(212,168,67,0.03)" : "transparent",
          }}>
            <div style={{ width: 20, textAlign: "center" }}>
              {m.rank <= 3 ? (
                (() => { const MedalIcon = medalIcons[m.rank - 1]; return <MedalIcon size={16} color={medalColors[m.rank - 1]} />; })()
              ) : (
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>{m.rank}</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{m.name}{m.isYou && " (You)"}</div>
            </div>
            <div style={{ fontSize: 9, color: "var(--text-muted)", textAlign: "right", display: "flex", alignItems: "center", gap: 4 }}>
              <BookOpen size={11} /> {typeof m.booksRead === "number" ? `${m.booksRead} books • ` : ""}{m.coursesCompleted} {m.coursesCompleted === 1 ? "course" : "courses"}
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 9, color: "var(--text-muted)", textAlign: "center" }}>
        Books-read counts are only available for your own account — this app doesn&apos;t yet track per-member borrowing history for other members.
      </p>
    </div>
  );
}
