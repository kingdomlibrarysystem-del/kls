"use client";

import { CartView } from "./_components/cart-view";
import { useLanguage } from "@/contexts/language-context";

export default function CartPage() {
  const { t } = useLanguage();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Cinzel',serif" }}>
          {t("m_cart.title")}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
          {t("m_cart.subtitle")}
        </div>
      </div>
      <CartView />
    </div>
  );
}
