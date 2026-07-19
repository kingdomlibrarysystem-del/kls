"use client";
import { Shield } from "lucide-react";
import { SWITCHABLE_ROLES, roleViewLabel, type SwitchableRole } from "@/lib/role-switcher";

const langList = [
  { flag: "🇬🇧", label: "English", value: "en" },
  { flag: "🇫🇷", label: "Français", value: "fr" },
  { flag: "🇷🇼", label: "Kinyarwanda", value: "rw" },
];

function triggerGoogleTranslate(lang: string) {
  document.cookie = `googtrans=/en/${lang}; path=/; max-age=31536000; SameSite=Lax`;
  const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (select) {
    select.value = lang;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }
  setTimeout(() => window.location.reload(), 100);
}

/** Language switcher + role-simulation footer section, shown at the bottom of the expanded sidebar only. */
export function SidebarFooter({ currentRole, onSwitchRole }: { currentRole?: string; onSwitchRole: (role: SwitchableRole) => void }) {
  return (
    <>
      <div style={{ padding: "12px 12px 4px", fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 1.5 }}>
        LANGUAGES
      </div>
      {langList.map((lang) => (
        <div
          key={lang.value}
          onClick={() => triggerGoogleTranslate(lang.value)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 12px",
            cursor: "pointer",
            color: "var(--text-secondary)",
            fontSize: 12,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
        >
          <span style={{ fontSize: 14 }}>{lang.flag}</span>
          {lang.label}
        </div>
      ))}

      <div style={{ padding: "12px 12px 4px", fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 1.5 }}>
        ROLE SIMULATION
      </div>
      {SWITCHABLE_ROLES.map((r) => (
        <div
          key={r}
          onClick={() => onSwitchRole(r)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 12px",
            cursor: "pointer",
            fontSize: 11,
            color: currentRole === r ? "var(--gold)" : "var(--text-secondary)",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
          onMouseLeave={(e) => {
            if (currentRole !== r) e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          <Shield size={12} />
          {roleViewLabel[r]}
        </div>
      ))}
    </>
  );
}
