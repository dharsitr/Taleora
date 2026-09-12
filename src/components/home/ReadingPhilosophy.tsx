import * as React from "react";
import { BookOpen, Eye, Flame, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

export function ReadingPhilosophy() {
  const features = [
    {
      icon: Eye,
      title: "Warm Paper Aesthetics",
      description:
        "Engineered with soft parchment tones and high-legibility serif fonts designed to eliminate ocular strain during long reading sessions.",
    },
    {
      icon: BookOpen,
      title: "Distraction-Free Immersion",
      description:
        "No intrusive popups or disruptive feeds. Pure, focused reading that honors the pacing of the author's voice.",
    },
    {
      icon: Flame,
      title: "Gentle Habit Building",
      description:
        "Maintain streaks and hit daily chapter goals through encouraging milestones, not stressful gamification.",
    },
    {
      icon: ShieldCheck,
      title: "Built with Security & Speed",
      description:
        "Equipped with modern Content Security Policy, strict headers, and lightning-fast SSR powered by Next.js.",
    },
  ];

  return (
    <section className="flex flex-col gap-6 pt-4 border-t border-border/60">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-primary font-semibold uppercase tracking-wider">
          The Taleora Experience
        </span>
        <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">
          Crafted For Those Who Truly Read
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
          We believe storytelling deserves reverence. Taleora provides an intimate digital space where narratives flourish.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <Card
              key={idx}
              className="bg-card/60 hover:bg-card hover:border-primary/30 transition-all duration-200"
            >
              <CardHeader className="p-5">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <CardTitle className="text-base font-semibold">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed pt-1">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
