"use client";

import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { adminMainNav, adminMgmtNav, memberNav, type NavItem } from "./nav-data";

/** Flattens top-level items and their `subItems` into a single list of real links (drops `href="#"` placeholders). */
function flattenLinks(items: NavItem[]): { icon: React.ReactNode; label: string; href: string }[] {
  return items.flatMap((item) => {
    if (item.subItems) return item.subItems;
    if (!item.href || item.href === "#") return [];
    return [{ icon: item.icon, label: item.label, href: item.href }];
  });
}

interface MobileMoreMenuProps {
  open: boolean;
  onClose: () => void;
  isMember: boolean;
  currentRoute: string;
}

/**
 * Full-section overflow menu for the mobile bottom nav — every sidebar
 * destination that doesn't fit in the fixed 5-slot bottom bar, reusing the
 * same `nav-data.tsx` source of truth as the desktop `Sidebar` so the two
 * never list different sets of pages.
 */
export function MobileMoreMenu({ open, onClose, isMember, currentRoute }: MobileMoreMenuProps) {
  const mainLinks = flattenLinks(isMember ? memberNav : adminMainNav);
  const mgmtLinks = isMember ? [] : flattenLinks(adminMgmtNav);

  return (
    <Modal open={open} onClose={onClose} title="All Sections" size="md">
      <nav aria-label="All dashboard sections" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {mgmtLinks.length > 0 && (
          <p style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 1.5, padding: "4px 4px 6px" }}>
            MAIN
          </p>
        )}
        {mainLinks.map((link) => (
          <MoreMenuLink key={link.href} link={link} active={currentRoute.startsWith(link.href)} onClick={onClose} />
        ))}

        {mgmtLinks.length > 0 && (
          <>
            <p style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 1.5, padding: "14px 4px 6px" }}>
              PLATFORM MANAGEMENT
            </p>
            {mgmtLinks.map((link) => (
              <MoreMenuLink key={link.href} link={link} active={currentRoute.startsWith(link.href)} onClick={onClose} />
            ))}
          </>
        )}
      </nav>
    </Modal>
  );
}

function MoreMenuLink({
  link,
  active,
  onClick,
}: {
  link: { icon: React.ReactNode; label: string; href: string };
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={link.href}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 8px",
        borderRadius: 6,
        textDecoration: "none",
        fontSize: 13,
        color: active ? "var(--gold)" : "var(--text-primary)",
        background: active ? "rgba(212,168,67,0.1)" : "transparent",
      }}
    >
      {link.icon}
      {link.label}
    </Link>
  );
}
