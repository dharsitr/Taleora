"use client";

import * as React from "react";
import Image from "next/image";
import {
  X,
  Camera,
  Lock,
  User,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { useAuth } from "@/lib/auth/use-auth";
import { uploadUserAvatar, updateUserProfile } from "@/lib/auth/profile";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const initialName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "";
  const initialAvatar =
    profile?.avatar_url || user?.user_metadata?.avatar_url || null;

  const [name, setName] = React.useState(initialName);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(initialAvatar);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const [isUploading, setIsUploading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  // Sync state whenever modal opens or profile changes
  React.useEffect(() => {
    if (isOpen) {
      setName(
        profile?.full_name ||
          user?.user_metadata?.full_name ||
          user?.email?.split("@")[0] ||
          ""
      );
      setAvatarUrl(
        profile?.avatar_url || user?.user_metadata?.avatar_url || null
      );
      setPreviewUrl(null);
      setSelectedFile(null);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, profile, user]);

  if (!isOpen || !user) return null;

  const username =
    profile?.username ||
    user.user_metadata?.username ||
    user.email?.split("@")[0] ||
    "user";

  const initials = (name || user.email || "U")
    .slice(0, 2)
    .toUpperCase();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image file size exceeds the 5MB limit.");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a valid display name.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      let finalAvatarUrl = avatarUrl;

      // If a new avatar file was chosen, upload it first
      if (selectedFile) {
        setIsUploading(true);
        const uploadedUrl = await uploadUserAvatar(user.id, selectedFile);
        if (uploadedUrl) {
          finalAvatarUrl = uploadedUrl;
          setAvatarUrl(uploadedUrl);
        }
        setIsUploading(false);
      }

      const res = await updateUserProfile(user.id, {
        fullName: name.trim(),
        avatarUrl: finalAvatarUrl,
      });

      if (!res.success) {
        setError(res.error || "Failed to update profile.");
        setIsSaving(false);
        return;
      }

      await refreshProfile();
      setSuccess(true);

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error("Profile save error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  const currentDisplayAvatar = previewUrl || avatarUrl;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-amber-500/25 bg-card/95 p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 bg-amber-500/15 blur-3xl pointer-events-none -z-10" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header & Avatar */}
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          {/* Avatar Picture with Camera Overlay */}
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-24 h-24 rounded-full border-2 border-amber-500/50 p-0.5 shadow-[0_0_20px_rgba(245,158,11,0.2)] relative overflow-hidden bg-gradient-to-tr from-amber-950 via-stone-900 to-zinc-900">
              {currentDisplayAvatar ? (
                <Image
                  src={currentDisplayAvatar}
                  alt={name || "User Avatar"}
                  fill
                  sizes="96px"
                  unoptimized={!currentDisplayAvatar.includes(".supabase.co") && !currentDisplayAvatar.startsWith("/")}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-serif font-bold text-amber-200">
                  {initials}
                </div>
              )}

              {/* Hover Badge Overlay */}
              <div className="absolute inset-0 bg-black/55 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-amber-400 mb-0.5" />
                <span className="text-[9px] font-semibold tracking-wide">Change</span>
              </div>
            </div>

            {/* Camera Floating Pill Badge */}
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-amber-500 text-stone-950 shadow-md border-2 border-card">
              <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/80 hover:bg-secondary text-[11px] font-medium text-foreground transition-colors cursor-pointer border border-border/80"
          >
            <Pencil className="w-3 h-3 text-amber-500" />
            <span>Change Profile Picture</span>
          </button>

          <div>
            <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">
              Edit Profile
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Update your public literary identity
            </p>
          </div>
        </div>

        {/* Error or Success notification */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Profile successfully updated!</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {/* Full Name (Editable) */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="profile-name"
              className="text-xs font-semibold uppercase tracking-wider text-foreground/80 flex items-center justify-between"
            >
              <span>Full Name</span>
              <span className="text-[10px] text-amber-500 lowercase font-normal">Editable</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="profile-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full h-11 pl-10 pr-10 rounded-xl border border-input bg-background/60 text-sm font-medium focus:outline-hidden focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/40 transition-all text-foreground"
              />
              <Pencil className="w-3.5 h-3.5 text-amber-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-80" />
            </div>
          </div>

          {/* Username (Locked / Non-Editable) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="profile-username"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
              >
                <span>Username</span>
              </label>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-500/90 font-mono">
                <Lock className="w-2.5 h-2.5" />
                Locked
              </span>
            </div>
            <div className="relative">
              <span className="text-sm font-mono text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                @
              </span>
              <input
                id="profile-username"
                type="text"
                readOnly
                disabled
                value={username}
                className="w-full h-11 pl-8 pr-10 rounded-xl border border-border/70 bg-secondary/30 font-mono text-xs text-muted-foreground cursor-not-allowed select-none"
              />
              <Lock className="w-3.5 h-3.5 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[11px] text-muted-foreground/90 flex items-center gap-1">
              <span>Usernames cannot be changed</span>
            </p>
          </div>

          {/* Email Address (Locked) */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="profile-email"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Email Address
            </label>
            <div className="relative">
              <input
                id="profile-email"
                type="email"
                readOnly
                disabled
                value={user.email || ""}
                className="w-full h-11 px-3.5 pr-10 rounded-xl border border-border/70 bg-secondary/30 font-mono text-xs text-muted-foreground cursor-not-allowed select-none"
              />
              <Lock className="w-3.5 h-3.5 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-3">
            <Button
              type="submit"
              disabled={isSaving || isUploading}
              className="flex-1 h-11 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.35)] transition-all cursor-pointer text-xs uppercase tracking-wide gap-2"
            >
              {(isSaving || isUploading) && (
                <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
              )}
              <span>{isSaving || isUploading ? "Saving Profile..." : "Save Profile Changes"}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving || isUploading}
              className="h-11 px-5 rounded-full border-border/80 text-xs font-medium cursor-pointer"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
