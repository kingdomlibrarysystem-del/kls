"use client";
import { useAuth } from "@/contexts/auth-context";
import { User, Mail, Phone, MapPin, Award, BookOpen, GraduationCap, CreditCard, Calendar, Shield, Edit2, Star, Heart } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();

  const stats = [
    { icon: <BookOpen size={16} />, label: "Books Read", value: "12", color: "var(--gold)" },
    { icon: <Heart size={16} />, label: "Favorites", value: "8", color: "var(--red-light)" },
    { icon: <GraduationCap size={16} />, label: "Courses Enrolled", value: "4", color: "var(--teal-light)" },
    { icon: <Award size={16} />, label: "Certificates", value: "3", color: "var(--purple-light)" },
    { icon: <Star size={16} />, label: "Avg Quiz Score", value: "72%", color: "var(--gold)" },
    { icon: <CreditCard size={16} />, label: "Payments", value: "2", color: "var(--green-light)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Cinzel',serif" }}>
          My Profile
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          Manage your personal information and view your activity
        </div>
      </div>

      {/* Profile card */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ height: 80, background: "linear-gradient(135deg, var(--gold-dim), var(--gold))", position: "relative" }}>
          <div style={{
            position: "absolute", bottom: -32, left: 20, width: 64, height: 64, borderRadius: "50%",
            background: "var(--bg-card)", border: "3px solid var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ width: 58, height: 58, borderRadius: "50%", background: "var(--bg-section)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User size={28} color="var(--gold)" />
            </div>
          </div>
        </div>
        <div style={{ padding: "40px 20px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                {user?.firstName || "Guest"} {user?.lastName || ""}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                <Shield size={10} /> Member since June 2026
              </div>
            </div>
            <button style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <Edit2 size={12} /> Edit Profile
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11, color: "var(--text-secondary)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Mail size={12} color="var(--text-muted)" /> {user?.email || "user@example.com"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Phone size={12} color="var(--text-muted)" /> +250 788 000 000</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><MapPin size={12} color="var(--text-muted)" /> Kigali, Rwanda</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Calendar size={12} color="var(--text-muted)" /> Joined June 2026</div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-section)", display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{s.value}</div>
              <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment info */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
          <CreditCard size={14} color="var(--green-light)" /> Payment Information
        </div>
        <div style={{ padding: "12px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>Membership Plan</div>
              <div style={{ fontSize: 9, color: "var(--text-muted)" }}>Premium Annual</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--green-light)" }}>Active</div>
              <div style={{ fontSize: 9, color: "var(--text-muted)" }}>Renews Jul 2027</div>
            </div>
          </div>
          <div style={{ height: 1, background: "var(--border-light)", margin: "8px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>Payment Method</div>
              <div style={{ fontSize: 9, color: "var(--text-muted)" }}>**** 4242 • Expires 12/28</div>
            </div>
            <span style={{ fontSize: 18 }}>💳</span>
          </div>
        </div>
      </div>
    </div>
  );
}
