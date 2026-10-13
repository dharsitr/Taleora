"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { MobileNav } from "./MobileNav";
import { Footer } from "./Footer";
import { PwaRegistration } from "@/components/pwa/PwaRegistration";
import { OfflineStatusBanner } from "@/components/offline/OfflineStatusBanner";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isReaderRoute = pathname.startsWith("/read");

  if (isReaderRoute) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
        <PwaRegistration />
        <OfflineStatusBanner />
        {children}
      </div>
    );
  }

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200 selection:bg-primary/20 selection:text-primary">
      <PwaRegistration />
      <OfflineStatusBanner />
      {/* Skip to main content for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 z-50 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold shadow-lg"
      >
        Skip to main story content
      </a>

      {/* Top Floating Glassmorphism Navbar */}
      <Navbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />

      {/* Main Layout Area - Clean Full Width Centered Workspace */}
      <div className="flex-1 flex w-full">
        <main
          id="main-content"
          className={`flex-1 min-w-0 flex flex-col w-full ${
            isAuthPage
              ? "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
              : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 gap-10 sm:gap-14"
          }`}
        >
          {children}
        </main>
      </div>

      {/* Mobile Drawer & Bottom Tab Bar */}
      <MobileNav
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Literary Footer */}
      <Footer />
    </div>
  );
}
