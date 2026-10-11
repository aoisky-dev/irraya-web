"use client";

import { useState, useEffect } from "react";
import { IconClipboard, IconX } from "@/components/Icons";
import { SizeGuideContent } from "@/components/SizeGuideContent";

type SizeChartModalProps = {
  selectedSize?: string;
  triggerClassName?: string;
};

export function SizeChartModal({ selectedSize, triggerClassName }: SizeChartModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Lock body scroll and listen for ESC key when open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={triggerClassName || "btn-size-chart-trigger"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          background: "none",
          border: "none",
          padding: "4px 0",
          fontSize: "0.82rem",
          fontWeight: 500,
          color: "var(--text-secondary, #666)",
          textDecoration: "underline",
          textUnderlineOffset: "3px",
          cursor: "pointer",
          whiteSpace: "nowrap"
        }}
        aria-label="Open Size Guide"
      >
        <IconClipboard size={14} />
        <span>Size Guide</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Irraya Size Guide & Measurement Chart"
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10001,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "clamp(8px, 3vw, 24px)",
            animation: "sizeChartFadeIn 0.2s ease-out"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-primary, #ffffff)",
              color: "var(--text-primary, #111111)",
              borderRadius: "var(--radius-lg, 16px)",
              maxWidth: "840px",
              width: "100%",
              maxHeight: "90dvh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 40px rgba(0,0,0,0.22), 0 0 1px rgba(0,0,0,0.15)",
              overflow: "hidden",
              position: "relative"
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "clamp(12px, 2.5vw, 18px) clamp(16px, 3vw, 24px)",
                borderBottom: "1px solid var(--border, #eaeaea)",
                backgroundColor: "var(--bg-primary, #ffffff)",
                flexShrink: 0
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "clamp(1.05rem, 2.5vw, 1.25rem)", fontWeight: 600, letterSpacing: "-0.01em" }}>
                  Size Chart &amp; Guide
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "var(--text-muted, #777)" }}>
                  Garment measurements for Irraya women’s apparel
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close size chart"
                style={{
                  background: "var(--bg-secondary, #f4f4f5)",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--text-primary, #111)",
                  transition: "background-color 0.15s ease",
                  flexShrink: 0
                }}
              >
                <IconX size={18} />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
                padding: "clamp(14px, 2.5vw, 24px)"
              }}
            >
              <SizeGuideContent selectedSize={selectedSize} />
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px clamp(16px, 3vw, 24px)",
                borderTop: "1px solid var(--border, #eaeaea)",
                backgroundColor: "var(--bg-secondary, #f8f9fa)",
                fontSize: "0.8rem",
                color: "var(--text-muted, #777)",
                flexShrink: 0
              }}
            >
              <span>Need bespoke fitting? Reach out for customization.</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="btn btn-secondary"
                style={{ fontSize: "0.8rem", padding: "5px 14px", height: "auto" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes sizeChartFadeIn {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}
