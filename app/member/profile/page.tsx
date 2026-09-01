"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { User, Mail, Phone, MapPin, Award, BookOpen, GraduationCap, CreditCard, Calendar, Shield, Edit2, Star, Heart } from "lucide-react";
import { useBorrowings } from "@/app/member/_shared/use-borrowings";
import { useFavorites } from "@/app/member/_shared/use-favorites";
import { useEnrollments } from "@/app/member/_shared/use-enrollments";
import { useAssessmentAttempts } from "@/app/member/_shared/use-assessment-attempts";
import { useCertificates } from "@/app/member/_shared/use-certificates";
import { NotificationPreferencesSection } from "./_components/notification-preferences-section";
import { TwoFactorSection } from "./_components/two-factor-section";
import { SessionsSection } from "./_components/sessions-section";
import { LoginHistorySection } from "./_components/login-history-section";
import { EditProfileModal } from "./_components/edit-profile-modal";

export default function ProfilePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [editingProfile, setEditingProfile] = useState(false);
  const { data: borrowings } = useBorrowings();
  const favorites = useFavorites(user?.id);
  const { data: enrollments } = useEnrollments();
  const { data: attempts } = useAssessmentAttempts();
  const { data: certificates } = useCertificates();

  const booksRead = borrowings.filter((b) => b.status === "returned").length;
  const memberCertificates = certificates.filter((c) => !c.revoked).length;
  const decidedAttempts = attempts.filter((a) => a.reviewStatus !== "PENDING_REVIEW");
  const avgScore = decidedAttempts.length
    ? Math.round(decidedAttempts.reduce((s, a) => s + (a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0), 0) / decidedAttempts.length)
    : 0;

  const stats = [
    { icon: <BookOpen size={18} />, label: t("m_profile.books_read"), value: String(booksRead), color: "var(--gold)" },
    { icon: <Heart size={18} />, label: t("m_profile.favorites"), value: String(favorites.length), color: "var(--red-light)" },
    { icon: <GraduationCap size={18} />, label: t("m_profile.courses_enrolled"), value: String(enrollments.length), color: "var(--teal-light)" },
    { icon: <Award size={18} />, label: t("m_profile.certificates"), value: String(memberCertificates), color: "var(--purple-light)" },
    { icon: <Star size={18} />, label: t("m_profile.avg_quiz"), value: `${avgScore}%`, color: "var(--gold)" },
    { icon: <CreditCard size={18} />, label: t("m_profile.payments"), value: "2", color: "var(--green-light)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Cinzel',serif" }}>
          {t("m_profile.title")}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
          {t("m_profile.subtitle")}
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
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
                {user?.firstName || "Guest"} {user?.lastName || ""}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                <Shield size={12} /> {t("m_profile.member_since")} June 2026
              </div>
            </div>
            <button
              onClick={() => setEditingProfile(true)}
              aria-label={t("m_profile.edit_profile")}
              style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              <Edit2 size={14} /> {t("m_profile.edit_profile")}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--text-secondary)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Mail size={14} color="var(--text-muted)" /> {user?.email || "user@example.com"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Phone size={14} color="var(--text-muted)" /> +250 788 000 000</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><MapPin size={14} color="var(--text-muted)" /> Kigali, Rwanda</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Calendar size={14} color="var(--text-muted)" /> Joined June 2026</div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--bg-section)", display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment info */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", fontSize: 14, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
          <CreditCard size={16} color="var(--green-light)" /> {t("m_profile.payment_info")}
        </div>
        <div style={{ padding: "12px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{t("m_profile.membership_plan")}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t("m_profile.premium_annual")}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--green-light)" }}>{t("m_profile.active")}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t("m_profile.renews")} Jul 2027</div>
            </div>
          </div>
          <div style={{ height: 1, background: "var(--border-light)", margin: "8px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{t("m_profile.payment_method")}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>**** 4242 • Expires 12/28</div>
            </div>
            <CreditCard size={20} color="var(--text-muted)" />
          </div>
        </div>
      </div>

      {/* Notification preferences */}
      <NotificationPreferencesSection userId={user?.id} />

      {/* Two-factor authentication (admin/manager/staff only) */}
      <TwoFactorSection />

      {/* Sessions & devices */}
      <SessionsSection />

      {/* Login history */}
      <LoginHistorySection />

      <EditProfileModal open={editingProfile} onClose={() => setEditingProfile(false)} />
    </div>
  );
}
