"use client";

import { useState } from "react";
import { Languages } from "lucide-react";

const langList = [
  { code: "GB", label: "English", value: "en" },
  { code: "FR", label: "Français", value: "fr" },
  { code: "RW", label: "Kinyarwanda", value: "rw" },
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

/** Current Google-Translate language from its cookie ("/en/fr" -> "fr"), English by default. */
function currentLang(): string {
  const match = document.cookie.match(/(?:^|; )googtrans=\/[^/]+\/([^;]+)/);
  return match?.[1] ?? "en";
}

/**
 * Language switcher, rendered inside the sidebar's profile menu (it used to
 * be a LANGUAGES section at the bottom of the nav list). Same Google
 * Translate mechanism as before; the active language is highlighted.
 */
export function ProfileMenuLanguages() {
  // Only mounted once the profile menu is opened (client-side), so reading the cookie here is safe.
  const [active] = useState(() => (typeof document === "undefined" ? "en" : currentLang()));

  return (
    <div style={{ padding: "10px 14px 12px", borderTop: "1px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "var(--text-secondary)", marginBottom: 8 }}>
        <Languages size={13} /> LANGUAGE
      </div>
      <div role="group" aria-label="Language" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
        {langList.map((lang) => {
          const isActive = active === lang.value;
          return (
            <button
              key={lang.value}
              type="button"
              aria-pressed={isActive}
              title={lang.label}
              onClick={() => triggerGoogleTranslate(lang.value)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
                padding: "6px 4px",
                borderRadius: 7,
                cursor: "pointer",
                border: `1px solid ${isActive ? "var(--gold)" : "var(--border)"}`,
                background: isActive ? "var(--gold-tint)" : "transparent",
                color: isActive ? "var(--gold)" : "var(--text-secondary)",
                transition: "background 0.15s, color 0.15s, border-color 0.15s",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700 }}>{lang.code}</span>
              <span style={{ fontSize: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{lang.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
