"use client";

import { useState } from "react";
import Image from "next/image";
import { IconClipboard, IconX } from "@/components/Icons";

/**
 * Opens a modal with the brand size measurement guide and the size chart
 * (both rendered as images) side by side. Assets are served from
 * /public/images/size-guide.
 */
export function SizeChartModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn btn-outline"
        style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", padding: "6px 12px" }}
      >
        <IconClipboard size={14} /> Size Chart
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Size chart"
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-lg, 20px)"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-primary, #fff)",
              borderRadius: "var(--radius-lg, 12px)",
              maxWidth: "760px",
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "var(--space-xl, 24px)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-md, 12px)" }}>
              <h3 style={{ margin: 0 }}>Size Chart &amp; Measurement Guide</h3>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close size chart"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
              >
                <IconX size={18} />
              </button>
            </div>

            <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "var(--space-md, 12px)" }}>
              Measure yourself as shown below, then compare to our size chart to find your best fit.
            </p>

            {/* Full-width, landscape-framed images (rather than a cramped
                side-by-side portrait split) so both stay large and legible. */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg, 16px)" }}>
              <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", background: "var(--bg-secondary)", borderRadius: "var(--radius-md, 8px)", overflow: "hidden" }}>
                <Image
                  src="/images/size-guide/size-measurement.jpg"
                  alt="How to measure yourself for the size chart"
                  fill
                  style={{ objectFit: "contain" }}
                  sizes="(max-width: 800px) 100vw, 720px"
                />
              </div>
              <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", background: "var(--bg-secondary)", borderRadius: "var(--radius-md, 8px)", overflow: "hidden" }}>
                <Image
                  src="/images/size-guide/size-chart.jpg"
                  alt="Size chart with measurements per size"
                  fill
                  style={{ objectFit: "contain" }}
                  sizes="(max-width: 800px) 100vw, 720px"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

