import * as React from "react";
import { Metadata } from "next";
import { ReadingDashboard } from "@/components/stats/ReadingDashboard";

export const metadata: Metadata = {
  title: "Reading Goals, Streaks & Analytics · Taleora",
  description: "Track your reading habits, streaks, milestones, and literary achievements.",
};

export default function GoalsPage() {
  return <ReadingDashboard />;
}
