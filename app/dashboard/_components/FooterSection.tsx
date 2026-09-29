"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, Map, Mic, Glasses, Globe, Bell, Gamepad2, Lock, Bot, Rocket, Send, Users, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "./section-card";

const features = [
  { icon: <Brain />, label: "AI Knowledge Engine", sub: "Smart recommendations" },
  { icon: <Map />, label: "Knowledge Map", sub: "Visualize connections" },
  { icon: <Mic />, label: "Voice Search", sub: "Search with your voice" },
  { icon: <Glasses />, label: "AR/VR Library", sub: "Immersive Experience" },
  { icon: <Globe />, label: "Multi-Language AI", sub: "Instant Translation" },
  { icon: <Bell />, label: "Smart Notifications", sub: "Personalized Alerts" },
  { icon: <Gamepad2 />, label: "Gamified Learning", sub: "Earn, Learn, Grow" },
  { icon: <Lock />, label: "Blockchain Security", sub: "Library in Your Pocket" },
];

const communityLinks = ["Forums", "Study Groups", "Live Events", "Share Resources", "Leaderboard"];

/**
 * Bottom row: roadmap features (2/3) + AI assistant, daily inspiration and
 * community hub (1/3). The old StatsBar numbers now live in DashboardKpis.
 */
export function FooterSection() {
  const router = useRouter();
  const [aiInput, setAiInput] = useState("");

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <SectionCard
        icon={<Rocket />}
        title="WHAT'S NEXT – INNOVATIVE FEATURES"
        description="On the roadmap for the Kingdom Library."
        className="xl:col-span-2"
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {features.map((f) => (
            <div key={f.label} className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-4 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary [&_svg]:size-5">{f.icon}</span>
              <span className="text-xs font-semibold text-foreground">{f.label}</span>
              <span className="text-[11px] text-muted-foreground">{f.sub}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="flex flex-col gap-4">
        <SectionCard icon={<Bot />} tone="gold" title="AI Kingdom Assistant" description="Ask me anything about the Kingdom Library — find resources, get recommendations, and more.">
          <form
            className="flex gap-2"
            onSubmit={(e) => { e.preventDefault(); router.push("/dashboard/ai"); }}
          >
            <Input value={aiInput} onChange={(e) => setAiInput(e.target.value)} placeholder="Ask anything…" className="h-9 text-sm" />
            <Button type="submit" size="icon-lg" aria-label="Ask the AI assistant"><Send /></Button>
          </form>
          <figure className="mt-4 rounded-lg border border-primary/25 p-4 text-center" style={{ background: "var(--inspiration-bg)" }}>
            <Quote className="mx-auto mb-2 size-4 text-primary" />
            <p className="text-[11px] font-bold tracking-widest text-primary">DAILY INSPIRATION</p>
            <blockquote className="mt-2 text-xs italic leading-relaxed text-muted-foreground">
              &ldquo;For the earth will be filled with the knowledge of the glory of the Lord as the waters cover the sea.&rdquo;
            </blockquote>
            <figcaption className="mt-2 text-[11px] font-semibold text-primary">Habakkuk 2:14</figcaption>
          </figure>
        </SectionCard>

        <SectionCard
          icon={<Users />}
          tone="gold"
          title="Kingdom Community Hub"
          description="Connect. Collaborate. Grow Together."
          action={<Badge variant="outline" className="text-muted-foreground">Coming soon</Badge>}
          className="flex-1"
        >
          <div className="flex flex-wrap gap-2">
            {communityLinks.map((l) => (
              <span key={l} className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">{l}</span>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
