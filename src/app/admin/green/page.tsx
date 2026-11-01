import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Leaf, Shield } from "lucide-react";
import { AdminGreenComputingTab } from "@/components/admin/AdminGreenComputingTab";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Green Computing Assessment Dashboard | Taleora",
  description:
    "College practical activity: website energy consumption, carbon footprint modeling, and green software engineering optimizations.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function AdminGreenPage() {
  let isDevOrAdmin = process.env.NODE_ENV !== "production";
  let userRole = "evaluator";
  let username = "demo-faculty";

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, username")
        .eq("id", user.id)
        .single();

      if (profile && (profile.role === "admin" || profile.role === "moderator")) {
        isDevOrAdmin = true;
        userRole = profile.role;
        username = profile.username;
      }
    }
  } catch (_err) {
    // In dev or local testing, allow inspection
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Top Header Banner */}
      <div className="border-b border-border/80 bg-card/40 backdrop-blur-md sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Title & Back Link */}
            <div className="flex items-center gap-3.5">
              <Link
                href="/admin"
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Return to Admin Workspace"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Leaf className="w-3.5 h-3.5" />
                  </div>
                  <h1 className="text-lg font-serif font-bold tracking-tight text-foreground">
                    Taleora Green Computing Practical Activity
                  </h1>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Estimation of Website Energy Consumption and Carbon Footprint Assessment
                </p>
              </div>
            </div>

            {/* Context Badge */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/80 bg-secondary/40 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium text-foreground">@{username}</span>
                <span className="text-muted-foreground">•</span>
                <span className="font-semibold uppercase text-[10px] text-emerald-500">
                  {userRole}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminGreenComputingTab />
      </main>
    </div>
  );
}
