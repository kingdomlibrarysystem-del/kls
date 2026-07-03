"use client";
import { useState } from "react";
import { GraduationCap, PlayCircle, Clock, Star, Users, Search, Filter, ChevronRight, BookOpen, Landmark, Music, Heart, Coins, HandHeart, Sparkles, Shield, Building2, Leaf } from "lucide-react";

const courseCategories = ["All", "Theology", "Leadership", "Personal Development", "Worship", "Marriage", "Business", "Health"];

const courses = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  title: ["Kingdom Foundations", "Understanding Divine Purpose", "Leadership & Governance", "The Art of Worship", "Kingdom Marriage Principles", "Financial Stewardship", "Prayer & Meditation", "The Nature of God", "Spiritual Authority", "Building Healthy Relationships", "The Kingdom Economy", "Divine Health & Wellness"][i],
  instructor: "Dr. Myles Munroe",
  category: courseCategories[Math.floor(Math.random() * (courseCategories.length - 1)) + 1],
  lessons: Math.floor(Math.random() * 20) + 5,
  duration: `${Math.floor(Math.random() * 10) + 2}h`,
  rating: (4 + Math.random()).toFixed(1),
  students: Math.floor(Math.random() * 500) + 50,
  image: [BookOpen, GraduationCap, Landmark, Music, Heart, Coins, HandHeart, Sparkles, Shield, Users, Building2, Leaf][i],
  description: "Comprehensive course covering key principles and practical applications for everyday life.",
}));

export default function ELearningPage() {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");

  const filtered = courses.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCat === "All" || c.category === activeCat;
    return matchSearch && matchCat;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Cinzel',serif" }}>
          E-Learning
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          Expand your knowledge with our course catalog
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative" }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-input, var(--bg-card))", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
        />
      </div>

      {/* Categories */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {courseCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            style={{
              padding: "5px 12px", borderRadius: 20, border: "1px solid var(--border)", cursor: "pointer",
              fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
              background: activeCat === cat ? "var(--teal-light)" : "transparent",
              color: activeCat === cat ? "#fff" : "var(--text-secondary)",
              transition: "all 0.15s",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Course grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
        {filtered.map((course) => (
          <div key={course.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", transition: "transform 0.2s", cursor: "pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.12)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
          >
            {/* Header */}
            <div style={{ height: 100, background: "linear-gradient(135deg, var(--teal-light-transparent, rgba(45,212,191,0.1)), var(--bg-section))", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <course.image size={32} color="var(--teal-light)" />
            </div>
            {/* Body */}
            <div style={{ padding: "10px 12px 12px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{course.title}</div>
              <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 6 }}>{course.instructor}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 8, color: "var(--teal-light)", background: "rgba(45,212,191,0.1)", padding: "1px 6px", borderRadius: 3 }}>{course.category}</span>
                <span style={{ fontSize: 8, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 2 }}><Clock size={10} />{course.duration}</span>
                <span style={{ fontSize: 8, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 2 }}><Star size={10} color="var(--gold)" />{course.rating}</span>
              </div>
              <div style={{ fontSize: 9, color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {course.description}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <PlayCircle size={14} color="var(--teal-light)" />
                <span style={{ fontSize: 9, color: "var(--text-muted)", flex: 1 }}>{course.lessons} lessons</span>
                <button style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "var(--teal-light)", color: "#fff", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                  Enroll
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
