"use client";

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

/** Language switcher footer section, shown at the bottom of the expanded sidebar only. */
export function SidebarFooter() {
  return (
    <>
      <div className="kcs-sidebar-label" style={{ padding: "14px 18px 6px" }}>
        LANGUAGES
      </div>
      {langList.map((lang) => (
        <div
          key={lang.value}
          role="button"
          tabIndex={0}
          onClick={() => triggerGoogleTranslate(lang.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              triggerGoogleTranslate(lang.value);
            }
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "1px 8px",
            padding: "7px 10px",
            borderRadius: 7,
            cursor: "pointer",
            color: "var(--text-secondary)",
            fontSize: 12.5,
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--gold)";
            e.currentTarget.style.background = "var(--bg-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-secondary)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <span style={{ fontSize: 15, lineHeight: 1 }}>{lang.flag}</span>
          {lang.label}
        </div>
      ))}
    </>
  );
}
