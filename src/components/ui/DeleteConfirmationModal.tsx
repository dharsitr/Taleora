"use client";

import * as React from "react";
import { AlertTriangle, Trash2, X, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title: string;
  itemName: string;
  itemType: "story" | "chapter";
  details?: string[];
  requireTextConfirmation?: boolean;
  expectedConfirmationText?: string;
  isDeleting: boolean;
  errorMessage?: string | null;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export function DeleteConfirmationModal({
  isOpen,
  title,
  itemName,
  itemType: _itemType,
  details = [],
  requireTextConfirmation = false,
  expectedConfirmationText = "DELETE",
  isDeleting,
  errorMessage,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  const [confirmationInput, setConfirmationInput] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      setConfirmationInput("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmed =
    !requireTextConfirmation ||
    confirmationInput.trim().toLowerCase() === expectedConfirmationText.trim().toLowerCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-destructive/30 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onCancel}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50 cursor-pointer"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-destructive/15 text-destructive border border-destructive/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 id="delete-modal-title" className="text-lg font-serif font-bold text-foreground">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Permanently deleting{" "}
              <span className="font-semibold text-foreground">&ldquo;{itemName}&rdquo;</span>
            </p>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="mt-4 p-3.5 rounded-xl border border-destructive/20 bg-destructive/5 text-xs text-destructive flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">This action cannot be undone.</span>
            <p className="text-muted-foreground text-[11px] mt-0.5">
              All associated content and server-side references will be permanently purged.
            </p>
          </div>
        </div>

        {/* Cascading Effects List */}
        {details.length > 0 && (
          <div className="mt-4 space-y-1.5 bg-secondary/40 p-3.5 rounded-xl border border-border/60">
            <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
              Cascading Cleanup:
            </span>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              {details.map((detail, idx) => (
                <li key={idx} className="leading-relaxed">
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Text Confirmation Input (for permanent book deletion) */}
        {requireTextConfirmation && (
          <div className="mt-4 space-y-2">
            <label className="text-xs font-medium text-foreground block">
              Please type <span className="font-mono font-bold text-destructive">{expectedConfirmationText}</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              disabled={isDeleting}
              placeholder={expectedConfirmationText}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50 disabled:opacity-50"
            />
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500">
            {errorMessage}
          </div>
        )}

        {/* Modal Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isDeleting}
            className="cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={!isConfirmed || isDeleting}
            className="gap-2 cursor-pointer bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
