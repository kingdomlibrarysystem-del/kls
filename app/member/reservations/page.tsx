"use client";
import { CalendarDays, BookOpen, Clock, CheckCircle2, XCircle, ChevronRight } from "lucide-react";

const mockReservations = [
  { id: 1, title: "The Spirit of Leadership", author: "Dr. Myles Munroe", reserved: "Jun 20, 2026", status: "Ready", queue: 0 },
  { id: 2, title: "Maximizing Your Potential", author: "Dr. Myles Munroe", reserved: "Jun 18, 2026", status: "Waiting", queue: 2 },
  { id: 3, title: "In Pursuit of Purpose", author: "Dr. Myles Munroe", reserved: "Jun 15, 2026", status: "Waiting", queue: 5 },
  { id: 4, title: "Kingdom Principles", author: "Dr. Myles Munroe", reserved: "Jun 10, 2026", status: "Fulfilled", fulfilled: "Jun 12, 2026" },
];

export default function ReservationsPage() {
  const active = mockReservations.filter((r) => r.status !== "Fulfilled");
  const fulfilled = mockReservations.filter((r) => r.status === "Fulfilled");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Cinzel',serif" }}>
          My Reservations
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          View and manage your book reservations
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {[
          { icon: <CalendarDays size={16} />, label: "Active Reservations", value: active.length.toString(), color: "var(--gold)" },
          { icon: <CheckCircle2 size={16} />, label: "Ready for Pickup", value: active.filter((r) => r.status === "Ready").length.toString(), color: "var(--green-light)" },
          { icon: <Clock size={16} />, label: "Fulfilled", value: fulfilled.length.toString(), color: "var(--teal-light)" },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-section)", display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{s.value}</div>
              <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Active reservations */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
          <CalendarDays size={14} color="var(--gold)" /> Active Reservations
        </div>
        {active.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 11 }}>No active reservations.</div>
        ) : (
          active.map((r) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: "1px solid var(--border-light)" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: r.status === "Ready" ? "rgba(34,197,94,0.1)" : "var(--bg-section)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {r.status === "Ready" ? <CheckCircle2 size={16} color="var(--green-light)" /> : <Clock size={16} color="var(--gold)" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{r.title}</div>
                <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{r.author} • Reserved {r.reserved}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 9, color: r.status === "Ready" ? "var(--green-light)" : "var(--gold)", fontWeight: 600 }}>{r.status}</div>
                {r.queue > 0 && <div style={{ fontSize: 8, color: "var(--text-muted)" }}>{r.queue} ahead of you</div>}
              </div>
              {r.status === "Ready" && (
                <button style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "var(--gold)", color: "#fff", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                  Borrow
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Fulfilled */}
      {fulfilled.length > 0 && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle2 size={14} color="var(--teal-light)" /> Fulfilled Reservations
          </div>
          {fulfilled.map((r) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 14px" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-section)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BookOpen size={16} color="var(--text-muted)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{r.title}</div>
                <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{r.author}</div>
              </div>
              <div style={{ fontSize: 9, color: "var(--green-light)" }}>Fulfilled {r.fulfilled}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
