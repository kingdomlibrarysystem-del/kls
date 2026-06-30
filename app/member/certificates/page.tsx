"use client";
import { Award, Download, Eye, ChevronRight, Star } from "lucide-react";

const mockCertificates = [
  { id: 1, title: "Kingdom Foundations", issued: "Jun 15, 2026", idStr: "KLS-CERT-2026-001", image: "🎓" },
  { id: 2, title: "The Art of Worship", issued: "Jun 10, 2026", idStr: "KLS-CERT-2026-002", image: "📜" },
  { id: 3, title: "Financial Stewardship", issued: "May 28, 2026", idStr: "KLS-CERT-2026-003", image: "🏆" },
];

export default function CertificatesPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Cinzel',serif" }}>
          My Certificates
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          View and download your earned certificates
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <Award size={24} color="var(--gold)" />
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>{mockCertificates.length}</div>
            <div style={{ fontSize: 9, color: "var(--text-muted)" }}>Certificates Earned</div>
          </div>
        </div>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <Star size={24} color="var(--gold)" />
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>3</div>
            <div style={{ fontSize: 9, color: "var(--text-muted)" }}>Courses Completed</div>
          </div>
        </div>
      </div>

      {/* Certificate cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
        {mockCertificates.map((cert) => (
          <div key={cert.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", transition: "transform 0.2s", cursor: "pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.12)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <div style={{ height: 120, background: "linear-gradient(135deg, var(--gold-dim), var(--gold))", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 32 }}>{cert.image}</span>
              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 1 }}>Certificate of Completion</span>
            </div>
            <div style={{ padding: "10px 12px 12px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{cert.title}</div>
              <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 6 }}>Issued: {cert.issued}</div>
              <div style={{ fontSize: 8, color: "var(--text-muted)", marginBottom: 10, fontFamily: "monospace" }}>{cert.idStr}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: "1px solid var(--gold)", background: "transparent", color: "var(--gold)", fontSize: 10, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <Eye size={12} /> View
                </button>
                <button style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: "none", background: "var(--gold)", color: "#fff", fontSize: 10, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <Download size={12} /> Download
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
