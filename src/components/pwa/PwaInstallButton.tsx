"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { subscribePwaInstall, promptPwaInstall } from "./PwaRegistration";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface PwaInstallButtonProps {
  className?: string;
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function PwaInstallButton({
  className,
  variant = "outline",
  size = "sm",
}: PwaInstallButtonProps) {
  const [canInstall, setCanInstall] = React.useState(false);
  const [isInstalling, setIsInstalling] = React.useState(false);

  React.useEffect(() => {
    return subscribePwaInstall((status) => {
      setCanInstall(status);
    });
  }, []);

  if (!canInstall) return null;

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await promptPwaInstall();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleInstall}
      disabled={isInstalling}
      className={cn(
        "gap-1.5 cursor-pointer text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10 shadow-xs",
        className
      )}
      title="Install Taleora as a standalone desktop or mobile application"
    >
      <Download className="w-3.5 h-3.5" />
      <span>Install App</span>
    </Button>
  );
}
