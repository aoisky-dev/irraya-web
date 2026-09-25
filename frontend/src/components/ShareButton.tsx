"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { IconShare, IconCheck } from "@/components/Icons";

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
}

/**
 * Uses the native Web Share API on supported (mostly mobile) browsers, and
 * falls back to copying the link to the clipboard everywhere else.
 */
export function ShareButton({ title, text, url }: ShareButtonProps) {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
      } catch {
        // User cancelled the native share sheet — no error toast needed.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      addToast("Link copied to clipboard", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast("Unable to copy link. Please copy it from the address bar.", "error");
    }
  };

  return (
    <button
      onClick={handleShare}
      className="btn-icon"
      style={{
        width: "48px",
        height: "48px",
        fontSize: "1.4rem",
        color: "var(--text-secondary)",
        flexShrink: 0
      }}
      aria-label="Share this product"
    >
      {copied ? <IconCheck size={20} /> : <IconShare size={20} />}
    </button>
  );
}

