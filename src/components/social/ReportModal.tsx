"use client";

import * as React from "react";
import { X, ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react";
import { ReportReason, ReportTargetType } from "@/types/social";
import { submitReport } from "@/lib/social/queries";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/use-auth";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reporterId?: string;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle?: string;
}

const REASONS: { id: ReportReason; label: string; desc: string }[] = [
  {
    id: "spam",
    label: "Spam or Advertising",
    desc: "Unsolicited promotions, repetitive posts, or automated links.",
  },
  {
    id: "harassment",
    label: "Harassment or Hate Speech",
    desc: "Hostile, abusive, threatening, or discriminatory remarks.",
  },
  {
    id: "inappropriate",
    label: "Inappropriate Content",
    desc: "Sexually explicit, graphic violence, or offensive materials.",
  },
  {
    id: "spoiler",
    label: "Unmarked Major Spoiler",
    desc: "Crucial plot twists or ending reveals without warning.",
  },
  {
    id: "other",
    label: "Other Community Issue",
    desc: "Violates Taleora reading community standards.",
  },
];

export function ReportModal({
  isOpen,
  onClose,
  reporterId,
  targetType,
  targetId,
  targetTitle,
}: ReportModalProps) {
  const { user } = useAuth();
  const effectiveReporterId = reporterId || user?.id;

  const [reason, setReason] = React.useState<ReportReason>("inappropriate");
  const [details, setDetails] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const handleClose = () => {
    setIsSuccess(false);
    setErrorMessage(null);
    setDetails("");
    setReason("inappropriate");
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveReporterId) {
      setErrorMessage("Please sign in to submit a report.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await submitReport(effectiveReporterId, {
        targetType,
        targetId,
        reason,
        details,
      });
      setIsSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit report";
      if (msg.includes("unique") || msg.includes("duplicate")) {
        setErrorMessage("You have already submitted a report for this content.");
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="font-serif text-lg font-bold text-foreground">
              Report Inappropriate Content
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close report dialog"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center text-center gap-3 animate-in zoom-in-95">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            <h4 className="font-serif text-lg font-bold text-foreground">
              Report Received
            </h4>
            <p className="text-xs text-muted-foreground max-w-xs">
              Thank you for keeping Taleora safe and welcoming. Our moderation queue will review this shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {targetTitle && (
              <div className="text-xs text-muted-foreground bg-secondary/50 p-2.5 rounded-lg border border-border/60">
                Reporting: <span className="font-semibold text-foreground">{targetTitle}</span>
              </div>
            )}

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Reasons list */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Reason for report
              </label>

              <div className="flex flex-col gap-2">
                {REASONS.map((r) => (
                  <label
                    key={r.id}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border transition-colors cursor-pointer ${
                      reason === r.id
                        ? "border-primary/60 bg-primary/5"
                        : "border-border hover:bg-secondary/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={r.id}
                      checked={reason === r.id}
                      onChange={() => setReason(r.id)}
                      className="mt-0.5 accent-primary cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-foreground">
                        {r.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {r.desc}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Optional details */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Additional context (Optional)
              </label>
              <textarea
                rows={2}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide any specific details that might assist moderation..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={isSubmitting}
                className="bg-destructive hover:bg-destructive/90 text-white"
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
