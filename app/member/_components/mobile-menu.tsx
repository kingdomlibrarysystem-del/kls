"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import MemberSidebar from "./member-sidebar";

/**
 * Phone/tablet menu for the member portal: a hamburger button at the top-left
 * of the topbar (hidden from `md` up, where the real sidebar is visible) that
 * opens a slide-in drawer containing the SAME MemberSidebar component. The
 * bottom nav only has room for five shortcuts; this gives small screens every
 * sidebar link (library, e-learning, notifications, messages, favorites,
 * leaderboard, profile, log out) from one source, so the two can never drift.
 */
export function MemberMobileMenu() {
  const [open, setOpen] = useState(false);

  // Escape closes the drawer.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:hidden"
      >
        <Menu size={20} />
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[100] md:hidden" role="dialog" aria-modal="true" aria-label="Member menu">
          <div className="absolute inset-0 bg-black/50 animate-in fade-in-0 duration-150" onClick={() => setOpen(false)} />
          <div
            className="absolute inset-y-0 left-0 flex max-w-[85vw] shadow-2xl animate-in slide-in-from-left duration-200"
            // Following any link in the sidebar closes the drawer (the page behind it changes).
            onClick={(e) => { if ((e.target as HTMLElement).closest("a")) setOpen(false); }}
          >
            <MemberSidebar collapsible={false} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-2 top-3 flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <X size={18} />
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
