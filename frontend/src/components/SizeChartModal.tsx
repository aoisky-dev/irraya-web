"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { IconClipboard, IconX } from "@/components/Icons";

export function SizeChartModal({ selectedSize }: { selectedSize?: string } = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chart" | "measurement">("chart");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and listen for ESC key
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

  const modalContent = isOpen && (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Size Chart & Measurement Guide"
      onClick={() => setIsOpen(false)}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100dvh",
        zIndex: 999999,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        boxSizing: "border-box"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#ffffff",
          color: "#111111",
          borderRadius: "16px",
          maxWidth: "620px",
          width: "100%",
          maxHeight: "90dvh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.4)",
          overflow: "hidden",
          position: "relative"
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #eaeaea",
            backgroundColor: "#ffffff",
            flexShrink: 0
          }}
        >
          {/* Tabs */}
          <div style={{ display: "inline-flex", background: "#f0f0f2", padding: "3px", borderRadius: "8px", gap: "3px" }}>
            <button
              type="button"
              onClick={() => setActiveTab("chart")}
              style={{
                border: "none",
                background: activeTab === "chart" ? "#ffffff" : "transparent",
                color: activeTab === "chart" ? "#111111" : "#666666",
                fontWeight: activeTab === "chart" ? 600 : 500,
                fontSize: "0.85rem",
                padding: "6px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                boxShadow: activeTab === "chart" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              Size Chart
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("measurement")}
              style={{
                border: "none",
                background: activeTab === "measurement" ? "#ffffff" : "transparent",
                color: activeTab === "measurement" ? "#111111" : "#666666",
                fontWeight: activeTab === "measurement" ? 600 : 500,
                fontSize: "0.85rem",
                padding: "6px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                boxShadow: activeTab === "measurement" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              How to Measure
            </button>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close size chart"
            style={{
              background: "#f4f4f5",
              border: "none",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#111111",
              flexShrink: 0
            }}
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Modal Body with Images */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            padding: "16px",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            backgroundColor: "#fafafa"
          }}
        >
          {activeTab === "chart" ? (
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "460px",
                aspectRatio: "678 / 1241",
                background: "#ffffff",
                borderRadius: "10px",
                overflow: "hidden",
                border: "1px solid #eaeaea",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
              }}
            >
              <Image
                src="/images/size-guide/size-chart.jpg"
                alt="Irraya Women's Size Chart"
                fill
                style={{ objectFit: "contain" }}
                sizes="(max-width: 600px) 100vw, 460px"
                priority
              />
            </div>
          ) : (
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "360px",
                aspectRatio: "960 / 1600",
                background: "#ffffff",
                borderRadius: "10px",
                overflow: "hidden",
                border: "1px solid #eaeaea",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
              }}
            >
              <Image
                src="/images/size-guide/size-measurement.jpg"
                alt="Irraya Size Measurement Guide"
                fill
                style={{ objectFit: "contain" }}
                sizes="(max-width: 600px) 100vw, 360px"
                priority
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
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

      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
