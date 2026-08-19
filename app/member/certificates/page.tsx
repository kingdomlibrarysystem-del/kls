"use client";
import { Award, Download, Eye, Star } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { UniversalButton } from "@/components/ui/universal-button";
import { useCertificates } from "@/app/member/_shared/use-certificates";

/**
 * Real certificates earned by this member, fetched from /api/certificates
 * filtered by the signed-in session's userId — issuance itself now happens
 * server-side as a side effect of the real enroll -> complete -> pass-
 * assessment loop (see app/api/_shared/issue-certificate-if-eligible.ts).
 */
export default function CertificatesPage() {
  const { data: certificates, loading } = useCertificates();

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }} aria-label="Loading certificates">
        <Skeleton style={{ height: 60, borderRadius: 8 }} />
        <Skeleton style={{ height: 140, borderRadius: 8 }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Cinzel',serif" }}>
          My Certificates
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
          View and download your earned certificates
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <Award size={24} color="var(--gold)" />
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>{certificates.filter((c) => !c.revoked).length}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Certificates Earned</div>
          </div>
        </div>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <Star size={24} color="var(--gold)" />
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>{new Set(certificates.map((c) => c.course)).size}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Courses Completed</div>
          </div>
        </div>
      </div>

      {certificates.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No certificates yet"
          description="Complete a course and pass its assessment to earn your first certificate."
          style={{ color: "var(--text-secondary)" }}
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {certificates.map((cert) => (
            <div key={cert.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", transition: "transform 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.12)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ height: 120, background: "linear-gradient(135deg, var(--gold-dim), var(--gold))", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4 }}>
                <Award size={32} color="#fff" />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 1 }}>
                  {cert.revoked ? "Revoked" : "Certificate of Completion"}
                </span>
              </div>
              <div style={{ padding: "10px 12px 12px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{cert.course}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>Issued: {cert.issuedAt}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 10, fontFamily: "monospace" }}>{cert.verificationCode}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <UniversalButton
                    href={`/member/certificates/${cert.id}`}
                    variant="gold-outline"
                    size="sm"
                    fullWidth
                    icon={<Eye size={14} />}
                    aria-label={`View certificate for ${cert.course}`}
                  >
                    View
                  </UniversalButton>
                  <UniversalButton
                    href={`/member/certificates/${cert.id}`}
                    variant="gold"
                    size="sm"
                    fullWidth
                    icon={<Download size={14} />}
                    aria-label={`Download certificate for ${cert.course}`}
                  >
                    Download
                  </UniversalButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
