"use client";
import { useState } from "react";
import {
  Brain,
  Map,
  Mic,
  Glasses,
  Globe,
  Bell,
  Gamepad2,
  Lock,
  Users,
  Download,
  ShoppingBag,
  Clock,
  Bot,
  Rocket,
} from "lucide-react";

const globalStats = [
  { icon: <Users size={24} />, value: "50,000+",  label: "Active Members"    },
  { icon: <Download size={24} />, value: "100,000+", label: "Items Borrowed"    },
  { icon: <ShoppingBag size={24} />, value: "5,000+",  label: "Resources Sold"    },
  { icon: <Globe size={24} />, value: "195+",     label: "Countries Reached" },
  { icon: <Clock size={24} />, value: "24/7",     label: "Library Access"    },
];

const features = [
  { icon: <Brain size={20} />, label: "AI Knowledge Engine",  sub: "Smart recommendations"  },
  { icon: <Map size={20} />, label: "Knowledge Map",        sub: "Visualize connections"   },
  { icon: <Mic size={20} />, label: "Voice Search",         sub: "Search with your voice"  },
  { icon: <Glasses size={20} />, label: "AR/VR Library",         sub: "Immersive Experience"    },
  { icon: <Globe size={20} />, label: "Multi-Language AI",     sub: "Instant Translation"     },
  { icon: <Bell size={20} />, label: "Smart Notifications",  sub: "Personalized Alerts"     },
  { icon: <Gamepad2 size={20} />, label: "Gamified Learning",     sub: "Earn, Learn, Grow"       },
  { icon: <Lock size={20} />, label: "Blockchain Security",  sub: "Library in Your Pocket"  },
];

export function StatsBar() {
  return (
    <div
      className="flex flex-wrap justify-center sm:justify-around gap-4"
      style={{ background: "var(--stats-gradient)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px" }}
    >
      {globalStats.map((s) => (
        <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ display: "flex", alignItems: "center" }}>{s.icon}</span>
          <div>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: 20, fontWeight: 700, color: "var(--gold)" }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FooterSection() {
  const [aiInput, setAiInput] = useState("");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-0">
      {/* Innovative features */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, letterSpacing: 0.3 }}>
          <Rocket size={14} /> WHAT'S NEXT – INNOVATIVE FEATURES
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {features.map((f) => (
            <div key={f.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "var(--bg-subtle)", borderRadius: 6, padding: "8px 4px", border: "1px solid var(--border-light)", textAlign: "center" }}>
              <span style={{ display: "flex", alignItems: "center" }}>{f.icon}</span>
              <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-primary)" }}>{f.label}</div>
              <div style={{ fontSize: 8, color: "var(--text-muted)" }}>{f.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI + Community */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px" }}>
          <div className="flex flex-col sm:flex-row" style={{ gap: 12, alignItems: "start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--gold)", marginBottom: 4 }}>
                <Bot size={14} /> AI Kingdom Assistant
              </div>
              <div style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 10, lineHeight: 1.4 }}>
                Ask me anything about the Kingdom Library. I can help you find resources, recommend books, and much more!
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 5, padding: "0 10px" }}>
                <input value={aiInput} onChange={(e) => setAiInput(e.target.value)} placeholder="Ask Anything" style={{ background: "none", border: "none", outline: "none", color: "var(--text-primary)", fontSize: 11, flex: 1, padding: "8px 0" }} />
                <button className="btn btn-gold btn-sm" style={{ padding: "4px 8px" }}>›</button>
              </div>
            </div>
            <div className="w-full sm:w-40" style={{ background: "var(--inspiration-bg)", border: "1px solid var(--border-gold)", borderRadius: 7, padding: "10px", textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontSize: 9, color: "var(--gold)", fontWeight: 700, marginBottom: 4, letterSpacing: 1 }}>DAILY INSPIRATION</div>
              <div style={{ fontSize: 9, color: "var(--text-secondary)", lineHeight: 1.5, fontStyle: "italic", marginBottom: 6 }}>
                "For the earth will be filled with the knowledge of the glory of the Lord as the waters cover the sea."
              </div>
              <div style={{ fontSize: 8, color: "var(--gold)" }}>Habakkuk 2:14</div>
            </div>
          </div>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: 13, fontWeight: 700, color: "var(--gold)" }}>KINGDOM COMMUNITY HUB</div>
            <div style={{ fontSize: 9, color: "var(--text-muted)" }}>Connect. Collaborate. Grow Together.</div>
          </div>
          <div className="flex flex-wrap justify-center" style={{ gap: 16 }}>
            {["Forums","Study Groups","Live Events","Share Resources","Leaderboard"].map((l) => (
              <button key={l} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gold)", fontSize: 10, fontWeight: 600, padding: "2px 0" }}>{l}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
