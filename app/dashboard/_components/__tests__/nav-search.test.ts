import { describe, expect, it } from "vitest";
import { adminMainNav, adminMgmtNav, memberNav } from "@/app/dashboard/_components/nav-data";
import { flattenNav, highlightParts, scoreEntry, searchNav } from "@/app/dashboard/_components/nav-search";

const admin = flattenNav([adminMainNav, adminMgmtNav]);
const labels = (hits: { label: string }[]) => hits.map((hit) => hit.label);

describe("flattenNav", () => {
  it("flattens top-level links and sub-items with their section", () => {
    expect(admin).toHaveLength(
      adminMainNav.filter((i) => !i.subItems).length +
        adminMainNav.reduce((n, i) => n + (i.subItems?.length ?? 0), 0) +
        adminMgmtNav.filter((i) => !i.subItems).length +
        adminMgmtNav.reduce((n, i) => n + (i.subItems?.length ?? 0), 0),
    );
    const inventory = admin.find((e) => e.label === "Book Inventory");
    expect(inventory).toMatchObject({ section: "Digital Library", topLevel: false, href: "/dashboard/library" });
    expect(admin.find((e) => e.label === "System Settings")).toMatchObject({ section: "", topLevel: true });
  });

  it("drops sections that have no href of their own", () => {
    expect(labels(admin)).not.toContain("Digital Library");
  });
});

describe("scoreEntry", () => {
  const entry = (label: string, section = "", href = "/x") => ({ label, section, href, icon: null, topLevel: false });

  it("ranks exact above prefix above substring", () => {
    expect(scoreEntry(entry("Roles & Permissions"), "roles & permissions")).toBeGreaterThan(
      scoreEntry(entry("Roles & Permissions"), "roles"),
    );
    expect(scoreEntry(entry("Roles & Permissions"), "roles")).toBeGreaterThan(scoreEntry(entry("Roles & Permissions"), "perm"));
  });

  it("matches a section name onto all of its pages", () => {
    expect(scoreEntry(entry("Overview", "E-Learning", "/dashboard/e-learning"), "e-learning")).toBeGreaterThan(0);
  });

  it("relates plain-English aliases to real pages", () => {
    expect(scoreEntry(entry("Book Inventory", "Digital Library", "/dashboard/library"), "books")).toBeGreaterThan(0);
    expect(scoreEntry(entry("Roles & Permissions", "", "/dashboard/roles"), "staff")).toBeGreaterThan(0);
    expect(scoreEntry(entry("KCS Map", "Digital Library", "/dashboard/library/kcs"), "location")).toBeGreaterThan(0);
  });

  it("tolerates typos", () => {
    expect(scoreEntry(entry("Quizzes & Exams"), "quizes")).toBeGreaterThan(0);
    expect(scoreEntry(entry("Book Inventory"), "inventry")).toBeGreaterThan(0);
  });

  it("scores nothing for an empty query", () => {
    expect(scoreEntry(entry("Book Inventory"), "  ")).toBe(0);
  });
});

describe("searchNav", () => {
  it("returns everything for an empty query", () => {
    expect(searchNav(admin, "")).toHaveLength(admin.length);
  });

  it("puts the exact page first", () => {
    const hits = searchNav(admin, "Members");
    expect(hits[0].label).toBe("Members");
    expect(hits[0].score).toBeGreaterThan(0);
  });

  it("only keeps related pages, dropping unrelated ones", () => {
    const labels = searchNav(admin, "quizzes").map((h) => h.label);
    expect(labels).toContain("Quizzes & Exams");
    expect(labels).not.toContain("Clinic Directory");
  });

  it("expands a matched section to its pages", () => {
    const hits = searchNav(admin, "health system");
    expect(hits.map((h) => h.section)).toContain("Health System");
    expect(hits.length).toBeGreaterThan(2);
  });

  it("never returns nothing for a nonsense query", () => {
    for (const query of ["xyzzy", "qqqq", "!!!", "k"]) {
      const hits = searchNav(admin, query);
      expect(hits.length).toBeGreaterThan(0);
    }
  });

  it("falls back to the closest pages when nothing scores", () => {
    const hits = searchNav(admin, "xyzzyplugh");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((h) => h.score <= 0)).toBe(true);
  });

  it("respects the result limit", () => {
    expect(searchNav(admin, "overview", { limit: 3 })).toHaveLength(3);
  });

  it("searches the member nav too", () => {
    const member = flattenNav([memberNav]);
    expect(labels(searchNav(member, "favorites"))[0]).toBe("Favorites");
  });
});

describe("highlightParts", () => {
  it("splits around every literal match", () => {
    expect(highlightParts("Book Inventory", "book")).toEqual([
      { text: "Book", match: true },
      { text: " Inventory", match: false },
    ]);
  });

  it("returns the whole label for an empty or non-literal query", () => {
    expect(highlightParts("Book Inventory", "")).toEqual([{ text: "Book Inventory", match: false }]);
    expect(highlightParts("Book Inventory", "xyz")).toEqual([{ text: "Book Inventory", match: false }]);
  });
});
