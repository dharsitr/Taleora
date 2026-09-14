"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
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

      {/* Top Navbar */}
      <Navbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />

      {/* Main Layout Area */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Content Container */}
        <main
          id="main-content"
          className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 flex flex-col gap-8"
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
