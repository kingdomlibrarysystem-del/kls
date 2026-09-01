"use client";

import { OrdersView } from "./_components/orders-view";
import { useLanguage } from "@/contexts/language-context";

export default function OrdersPage() {
  const { t } = useLanguage();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Cinzel',serif" }}>
          {t("m_orders.title")}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
          {t("m_orders.subtitle")}
        </div>
      </div>
      <OrdersView />
    </div>
  );
}
