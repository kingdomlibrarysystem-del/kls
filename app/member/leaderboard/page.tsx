"use client";
import { Award, TrendingUp, BookOpen, Star, Crown, Medal, Trophy } from "lucide-react";

const medalColors = ["#D4AF37", "#A8A9AD", "#CD7F32"];
const medalIcons = [Trophy, Medal, Award];

const topMembers = [
  { rank: 1, name: "Sarah Johnson", booksRead: 42, coursesCompleted: 8, points: 2840 },
  { rank: 2, name: "David Mugisha", booksRead: 38, coursesCompleted: 6, points: 2520 },
  { rank: 3, name: "Grace Uwimana", booksRead: 35, coursesCompleted: 7, points: 2310 },
];

const otherMembers = [
  { rank: 4, name: "Peter Niyonzima", booksRead: 29, coursesCompleted: 5, points: 1980 },
  { rank: 5, name: "Esther Kabatesi", booksRead: 25, coursesCompleted: 4, points: 1750 },
  { rank: 6, name: "John Habimana", booksRead: 22, coursesCompleted: 3, points: 1520 },
  { rank: 7, name: "Mary Nyiraneza", booksRead: 20, coursesCompleted: 4, points: 1400 },
  { rank: 8, name: "Samuel Ndagijimana", booksRead: 18, coursesCompleted: 2, points: 1150 },
];

export default function LeaderboardPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Cinzel',serif" }}>
          Leaderboard
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          Top readers and learners in the Kingdom Library community
        </div>
      </div>

      {/* Podium */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {topMembers.map((m) => (
          <div key={m.rank} style={{
            background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 12px", textAlign: "center",
            position: "relative", overflow: "hidden",
            transform: m.rank === 1 ? "scale(1.02)" : "none",
            borderColor: m.rank === 1 ? "var(--gold)" : m.rank === 2 ? "var(--text-muted)" : "var(--border)",
          }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
              {(() => { const MedalIcon = medalIcons[m.rank - 1]; return <MedalIcon size={28} color={medalColors[m.rank - 1]} />; })()}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{m.name}</div>
            <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 6 }}>{m.points.toLocaleString()} pts</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--gold)" }}>{m.booksRead}</div>
                <div style={{ fontSize: 8, color: "var(--text-muted)" }}>Books</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--teal-light)" }}>{m.coursesCompleted}</div>
                <div style={{ fontSize: 8, color: "var(--text-muted)" }}>Courses</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full ranking */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
          <TrendingUp size={14} color="var(--gold)" /> Full Rankings
        </div>
        {[...topMembers, ...otherMembers].map((m) => (
          <div key={m.rank} style={{
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
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{m.name}</div>
            </div>
            <div style={{ fontSize: 9, color: "var(--text-muted)", textAlign: "right" }}>
              {m.booksRead} books • {m.coursesCompleted} courses
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", minWidth: 50, textAlign: "right" }}>
              {m.points.toLocaleString()} pts
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
