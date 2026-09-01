"use client";

import Image from "next/image";
import { Check } from "lucide-react";

export type MobileMoneyProvider = "MTN" | "AIRTEL";
export type PaymentRail = "PAYPACK" | "STRIPE";

const MTN_LOGO =
  "https://res.cloudinary.com/kapkga1t/image/upload/v1788259785/mtn.jpg";
const AIRTEL_LOGO =
  "https://res.cloudinary.com/kapkga1t/image/upload/v1788252601/air.png";
const CARD_LOGO =
  "https://res.cloudinary.com/kapkga1t/image/upload/v1788252882/card.jpg";

interface RadioCardProps {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}

function RadioCard({ selected, onSelect, children }: RadioCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderRadius: 10,
        border: `1.5px solid ${selected ? "var(--gold)" : "var(--border)"}`,
        background: selected ? "var(--bg-section)" : "var(--bg-card)",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.15s",
      }}
    >
      {children}
      <div
        style={{
          marginLeft: "auto",
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: `2px solid ${selected ? "var(--gold)" : "var(--border)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {selected && (
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: "var(--gold)",
            }}
          />
        )}
      </div>
    </button>
  );
}

function LogoBadge({ src, alt }: { src: string; alt: string }) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 8,
        overflow: "hidden",
        flexShrink: 0,
        position: "relative",
        background: "#fff",
        border: "1px solid var(--border)",
      }}
    >
      <Image src={src} alt={alt} fill sizes="40px" className="object-cover" />
    </div>
  );
}

interface PaymentMethodSelectorProps {
  rail: PaymentRail;
  onRailChange: (rail: PaymentRail) => void;
  provider: MobileMoneyProvider;
  onProviderChange: (provider: MobileMoneyProvider) => void;
}

/**
 * Payment-method selection redesigned per the reference screenshots
 * (.claude/tasks-n-gaps): exactly two real cards — Mobile Money (MTN +
 * Airtel combined, switchable inside the same card, matching the
 * grocery-app reference's "Mobile Money" card) and Card (Visa/
 * Mastercard via Stripe). Real brand logos from the three Cloudinary
 * URLs the product owner supplied, not lucide icons or invented colors —
 * this is real third-party branding, not a UI accent this app owns.
 */
export function PaymentMethodSelector({
  rail,
  onRailChange,
  provider,
  onProviderChange,
}: PaymentMethodSelectorProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <RadioCard
        selected={rail === "PAYPACK"}
        onSelect={() => onRailChange("PAYPACK")}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <LogoBadge src={MTN_LOGO} alt="MTN Mobile Money" />
          <LogoBadge src={AIRTEL_LOGO} alt="Airtel Money" />
        </div>
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            Mobile Money
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            MTN MoMo or Airtel Money
          </div>
        </div>
      </RadioCard>

      {rail === "PAYPACK" && (
        <div style={{ display: "flex", gap: 8, paddingLeft: 8 }}>
          {(["MTN", "AIRTEL"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onProviderChange(p)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "7px 10px",
                borderRadius: 7,
                border: `1px solid ${provider === p ? "var(--gold)" : "var(--border)"}`,
                background: provider === p ? "var(--gold)" : "var(--bg-card)",
                color: provider === p ? "#fff" : "var(--text-secondary)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {provider === p && <Check size={12} />}
              {p === "MTN" ? "MTN MoMo" : "Airtel Money"}
            </button>
          ))}
        </div>
      )}

      <RadioCard
        selected={rail === "STRIPE"}
        onSelect={() => onRailChange("STRIPE")}
      >
        <LogoBadge src={CARD_LOGO} alt="Visa / Mastercard" />
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            Card
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Visa or Mastercard
          </div>
        </div>
      </RadioCard>
    </div>
  );
}
