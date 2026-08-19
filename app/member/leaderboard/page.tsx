"use client";
import { TrendingUp, BookOpen, Award, Medal, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useCertificatesAdmin } from "@/app/dashboard/e-learning/certificates/_components/use-certificates-admin";
import { useBorrowings } from "@/app/member/_shared/use-borrowings";

const medalColors = ["#D4AF37", "#A8A9AD", "#CD7F32"];
const medalIcons = [Trophy, Medal, Award];

/**
 * Real ranking derived from the real, cross-member Certificate collection
 * (via the admin certificates hook — reading across all members is
 * inherently a cross-member view with no dependency on "current user",
 * same reasoning use-certificates-admin.ts's own docstring already gives).
 * "Books read" has no per-member field anywhere (Borrowing's real
 * /api/borrowings is scoped to the signed-in session's own userId only),
 * so it's shown only on the current member's own row rather than
 * fabricated for everyone else, matching DashboardStats.tsx's established
 * precedent of leaving a stat honestly absent (its "Payments" stat) rather
 * than inventing a number no store backs.
 */
function useRealRankings() {
  const { user } = useAuth();
  const { data: certificates } = useCertificatesAdmin();
  const { data: borrowings } = useBorrowings();
  const currentMemberName = user ? `${user.firstName} ${user.lastName}`.trim() : "";

  const byMember = new Map<string, number>();
  certificates.filter((c) => !c.revoked).forEach((c) => {
    byMember.set(c.member, (byMember.get(c.member) ?? 0) + 1);
  });
  if (currentMemberName && !byMember.has(currentMemberName)) byMember.set(currentMemberName, 0);

  const booksRead = borrowings.filter((b) => b.status === "returned").length;

  return Array.from(byMember.entries())
    .map(([name, coursesCompleted]) => ({
      name,
      coursesCompleted,
      booksRead: name === currentMemberName ? booksRead : undefined,
      isYou: name === currentMemberName,
    }))
    .sort((a, b) => b.coursesCompleted - a.coursesCompleted)
    .map((m, i) => ({ ...m, rank: i + 1 }));
}

export default function LeaderboardPage() {
  const ranked = useRealRankings();
  const top3 = ranked.slice(0, 3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Cinzel',serif" }}>
          Leaderboard
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
          Ranked by real courses completed, from the real certificates record
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
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
                {m.name}{m.isYou && " (You)"}
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 6 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--teal-light)" }}>{m.coursesCompleted}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Courses</div>
                </div>
                {typeof m.booksRead === "number" && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--gold)" }}>{m.booksRead}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Books</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", fontSize: 14, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
          <TrendingUp size={16} color="var(--gold)" /> Full Rankings
        </div>
        {ranked.map((m) => (
          <div key={m.name} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderBottom: "1px solid var(--border-light)",
            background: m.rank <= 3 ? "rgba(212,168,67,0.03)" : "transparent",
          }}>
            <div style={{ width: 20, textAlign: "center" }}>
              {m.rank <= 3 ? (
                (() => { const MedalIcon = medalIcons[m.rank - 1]; return <MedalIcon size={18} color={medalColors[m.rank - 1]} />; })()
              ) : (
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>{m.rank}</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{m.name}{m.isYou && " (You)"}</div>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "right", display: "flex", alignItems: "center", gap: 4 }}>
              <BookOpen size={13} /> {typeof m.booksRead === "number" ? `${m.booksRead} books • ` : ""}{m.coursesCompleted} {m.coursesCompleted === 1 ? "course" : "courses"}
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
        Books-read counts are only available for your own account — this app doesn&apos;t yet track per-member borrowing history for other members.
      </p>
    </div>
  );
}
