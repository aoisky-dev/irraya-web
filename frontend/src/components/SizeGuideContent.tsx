"use client";

import { useState } from "react";
import Image from "next/image";
import { IconInfo, IconCheck } from "@/components/Icons";

export type MeasurementUnit = "in" | "cm";

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export interface MeasurementRow {
  name: string;
  in: Record<typeof SIZES[number], string>;
  cm: Record<typeof SIZES[number], string>;
}

export const TOP_MEASUREMENTS: MeasurementRow[] = [
  {
    name: "Bust",
    in: { XS: "32 – 33", S: "34 – 35", M: "36 – 38", L: "38 – 40", XL: "42 – 44", XXL: "44 – 46" },
    cm: { XS: "81 – 84", S: "86 – 89", M: "91 – 97", L: "97 – 102", XL: "107 – 112", XXL: "112 – 117" },
  },
  {
    name: "Waist",
    in: { XS: "26 – 28", S: "28 – 30", M: "30 – 32", L: "32 – 36", XL: "36 – 40", XXL: "40 – 42" },
    cm: { XS: "66 – 71", S: "71 – 76", M: "76 – 81", L: "81 – 91", XL: "91 – 102", XXL: "102 – 107" },
  },
  {
    name: "Hips",
    in: { XS: "36 – 38", S: "38 – 40", M: "40 – 42", L: "42 – 44", XL: "46 – 48", XXL: "49 – 50" },
    cm: { XS: "91 – 97", S: "97 – 102", M: "102 – 107", L: "107 – 112", XL: "117 – 122", XXL: "124 – 127" },
  },
  {
    name: "Crop Top Length",
    in: { XS: "14", S: "14.5", M: "15", L: "15.5", XL: "15.5", XXL: "16" },
    cm: { XS: "35.5", S: "37", M: "38", L: "39.5", XL: "39.5", XXL: "40.5" },
  },
  {
    name: "Kurti Length",
    in: { XS: "25", S: "25.5", M: "26", L: "27", XL: "29", XXL: "31" },
    cm: { XS: "63.5", S: "65", M: "66", L: "68.5", XL: "73.5", XXL: "79" },
  },
];

export const BOTTOM_MEASUREMENTS: MeasurementRow[] = [
  {
    name: "Waist",
    in: { XS: "29", S: "31", M: "33", L: "35", XL: "38", XXL: "38" },
    cm: { XS: "73.5", S: "79", M: "84", L: "89", XL: "96.5", XXL: "96.5" },
  },
  {
    name: "Pant Length",
    in: { XS: "36", S: "36", M: "38", L: "40", XL: "42", XXL: "44" },
    cm: { XS: "91.5", S: "91.5", M: "96.5", L: "101.5", XL: "106.5", XXL: "112" },
  },
  {
    name: "Skirt Length",
    in: { XS: "30", S: "32", M: "34", L: "36", XL: "38", XXL: "40" },
    cm: { XS: "76", S: "81", M: "86.5", L: "91.5", XL: "96.5", XXL: "101.5" },
  },
];

type SizeGuideContentProps = {
  selectedSize?: string;
  defaultTab?: "table" | "measure" | "image";
};

export function SizeGuideContent({ selectedSize, defaultTab = "table" }: SizeGuideContentProps) {
  const [activeTab, setActiveTab] = useState<"table" | "measure" | "image">(defaultTab);
  const [unit, setUnit] = useState<MeasurementUnit>("in");

  const normalizedSelected = selectedSize ? selectedSize.trim().toUpperCase() : undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Tab Navigation & Unit Switcher */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          paddingBottom: "12px",
          borderBottom: "1px solid var(--border, #eaeaea)"
        }}
      >
        {/* Tab Pills */}
        <div style={{ display: "inline-flex", background: "var(--bg-secondary, #f0f0f2)", padding: "3px", borderRadius: "8px", gap: "2px" }}>
          <button
            type="button"
            onClick={() => setActiveTab("table")}
            style={{
              border: "none",
              background: activeTab === "table" ? "var(--bg-primary, #ffffff)" : "transparent",
              color: activeTab === "table" ? "var(--text-primary, #111)" : "var(--text-secondary, #666)",
              fontWeight: activeTab === "table" ? 600 : 500,
              fontSize: "0.82rem",
              padding: "6px 14px",
              borderRadius: "6px",
              cursor: "pointer",
              boxShadow: activeTab === "table" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease"
            }}
          >
            Size Chart
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("measure")}
            style={{
              border: "none",
              background: activeTab === "measure" ? "var(--bg-primary, #ffffff)" : "transparent",
              color: activeTab === "measure" ? "var(--text-primary, #111)" : "var(--text-secondary, #666)",
              fontWeight: activeTab === "measure" ? 600 : 500,
              fontSize: "0.82rem",
              padding: "6px 14px",
              borderRadius: "6px",
              cursor: "pointer",
              boxShadow: activeTab === "measure" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease"
            }}
          >
            How to Measure
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("image")}
            style={{
              border: "none",
              background: activeTab === "image" ? "var(--bg-primary, #ffffff)" : "transparent",
              color: activeTab === "image" ? "var(--text-primary, #111)" : "var(--text-secondary, #666)",
              fontWeight: activeTab === "image" ? 600 : 500,
              fontSize: "0.82rem",
              padding: "6px 14px",
              borderRadius: "6px",
              cursor: "pointer",
              boxShadow: activeTab === "image" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease"
            }}
          >
            Original Scan
          </button>
        </div>

        {/* Unit Toggle */}
        {activeTab === "table" && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted, #777)", fontWeight: 500 }}>Unit:</span>
            <div style={{ display: "inline-flex", background: "var(--bg-secondary, #f0f0f2)", padding: "2px", borderRadius: "6px" }}>
              <button
                type="button"
                onClick={() => setUnit("in")}
                style={{
                  border: "none",
                  background: unit === "in" ? "var(--bg-primary, #ffffff)" : "transparent",
                  color: unit === "in" ? "var(--text-primary, #111)" : "var(--text-secondary, #666)",
                  fontWeight: unit === "in" ? 600 : 400,
                  fontSize: "0.78rem",
                  padding: "4px 10px",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Inches (in)
              </button>
              <button
                type="button"
                onClick={() => setUnit("cm")}
                style={{
                  border: "none",
                  background: unit === "cm" ? "var(--bg-primary, #ffffff)" : "transparent",
                  color: unit === "cm" ? "var(--text-primary, #111)" : "var(--text-secondary, #666)",
                  fontWeight: unit === "cm" ? 600 : 400,
                  fontSize: "0.78rem",
                  padding: "4px 10px",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                CM (cm)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tab 1: Interactive Table */}
      {activeTab === "table" && (
        <div>
          {normalizedSelected && SIZES.includes(normalizedSelected as any) && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "0.82rem",
                color: "#065f46",
                marginBottom: "14px"
              }}
            >
              <IconCheck size={14} />
              <span>
                Currently viewing size <strong>{normalizedSelected}</strong> (highlighted in the table below).
              </span>
            </div>
          )}

          {/* Top Garments */}
          <div style={{ marginBottom: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted, #777)" }}>
                Top Garments (Kurtis &amp; Crop Tops)
              </span>
            </div>

            <div style={{ overflowX: "auto", border: "1px solid var(--border, #eaeaea)", borderRadius: "8px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem", minWidth: "520px" }}>
                <thead>
                  <tr style={{ background: "var(--bg-secondary, #f8f9fa)", borderBottom: "1px solid var(--border, #eaeaea)" }}>
                    <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 600, position: "sticky", left: 0, background: "var(--bg-secondary, #f8f9fa)", zIndex: 1 }}>
                      Measurement
                    </th>
                    {SIZES.map((size) => {
                      const isSelected = size === normalizedSelected;
                      return (
                        <th
                          key={size}
                          style={{
                            textAlign: "center",
                            padding: "10px 10px",
                            fontWeight: 700,
                            color: isSelected ? "var(--accent-primary, #b91c1c)" : "var(--text-primary, #111)",
                            background: isSelected ? "rgba(225, 29, 72, 0.06)" : "transparent"
                          }}
                        >
                          {size}
                          {isSelected && (
                            <span style={{ display: "block", fontSize: "0.65rem", fontWeight: 600, color: "var(--accent-warm, #e11d48)", textTransform: "uppercase" }}>
                              Selected
                            </span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {TOP_MEASUREMENTS.map((row, idx) => (
                    <tr
                      key={row.name}
                      style={{
                        borderBottom: idx < TOP_MEASUREMENTS.length - 1 ? "1px solid var(--border, #f0f0f0)" : "none",
                        background: idx % 2 === 1 ? "var(--bg-secondary, #fafafa)" : "transparent"
                      }}
                    >
                      <td style={{ padding: "9px 14px", fontWeight: 500, position: "sticky", left: 0, background: idx % 2 === 1 ? "var(--bg-secondary, #fafafa)" : "var(--bg-primary, #fff)", zIndex: 1 }}>
                        {row.name} <span style={{ fontSize: "0.72rem", color: "var(--text-muted, #888)", fontWeight: 400 }}>({unit})</span>
                      </td>
                      {SIZES.map((size) => {
                        const isSelected = size === normalizedSelected;
                        return (
                          <td
                            key={size}
                            style={{
                              textAlign: "center",
                              padding: "9px 10px",
                              fontVariantNumeric: "tabular-nums",
                              fontWeight: isSelected ? 600 : 400,
                              background: isSelected ? "rgba(225, 29, 72, 0.06)" : "transparent"
                            }}
                          >
                            {row[unit][size]}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Garments */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted, #777)" }}>
                Bottom Garments (Pants &amp; Skirts)
              </span>
            </div>

            <div style={{ overflowX: "auto", border: "1px solid var(--border, #eaeaea)", borderRadius: "8px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem", minWidth: "520px" }}>
                <thead>
                  <tr style={{ background: "var(--bg-secondary, #f8f9fa)", borderBottom: "1px solid var(--border, #eaeaea)" }}>
                    <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 600, position: "sticky", left: 0, background: "var(--bg-secondary, #f8f9fa)", zIndex: 1 }}>
                      Measurement
                    </th>
                    {SIZES.map((size) => {
                      const isSelected = size === normalizedSelected;
                      return (
                        <th
                          key={size}
                          style={{
                            textAlign: "center",
                            padding: "10px 10px",
                            fontWeight: 700,
                            color: isSelected ? "var(--accent-primary, #b91c1c)" : "var(--text-primary, #111)",
                            background: isSelected ? "rgba(225, 29, 72, 0.06)" : "transparent"
                          }}
                        >
                          {size}
                          {isSelected && (
                            <span style={{ display: "block", fontSize: "0.65rem", fontWeight: 600, color: "var(--accent-warm, #e11d48)", textTransform: "uppercase" }}>
                              Selected
                            </span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {BOTTOM_MEASUREMENTS.map((row, idx) => (
                    <tr
                      key={row.name}
                      style={{
                        borderBottom: idx < BOTTOM_MEASUREMENTS.length - 1 ? "1px solid var(--border, #f0f0f0)" : "none",
                        background: idx % 2 === 1 ? "var(--bg-secondary, #fafafa)" : "transparent"
                      }}
                    >
                      <td style={{ padding: "9px 14px", fontWeight: 500, position: "sticky", left: 0, background: idx % 2 === 1 ? "var(--bg-secondary, #fafafa)" : "var(--bg-primary, #fff)", zIndex: 1 }}>
                        {row.name} <span style={{ fontSize: "0.72rem", color: "var(--text-muted, #888)", fontWeight: 400 }}>({unit})</span>
                      </td>
                      {SIZES.map((size) => {
                        const isSelected = size === normalizedSelected;
                        return (
                          <td
                            key={size}
                            style={{
                              textAlign: "center",
                              padding: "9px 10px",
                              fontVariantNumeric: "tabular-nums",
                              fontWeight: isSelected ? 600 : 400,
                              background: isSelected ? "rgba(225, 29, 72, 0.06)" : "transparent"
                            }}
                          >
                            {row[unit][size]}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fit Advisory Box */}
          <div
            style={{
              background: "var(--bg-secondary, #f9fafb)",
              border: "1px solid var(--border, #e5e7eb)",
              borderRadius: "8px",
              padding: "10px 14px",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              fontSize: "0.8rem",
              color: "var(--text-secondary, #555)",
              lineHeight: 1.45
            }}
          >
            <IconInfo size={16} style={{ flexShrink: 0, marginTop: "2px", color: "var(--text-muted, #777)" }} />
            <div>
              <strong>Fit Advisory:</strong> All measurements reflect standard finished garment sizing in{" "}
              {unit === "in" ? "inches" : "centimeters"}. If you fall between sizes, we recommend selecting the larger size for a relaxed and comfortable drape.
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: How to Measure */}
      {activeTab === "measure" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", alignItems: "center" }}>
          {/* Visual Diagram */}
          <div
            style={{
              position: "relative",
              background: "var(--bg-secondary, #f9fafb)",
              borderRadius: "12px",
              padding: "16px",
              border: "1px solid var(--border, #eaeaea)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <div style={{ position: "relative", width: "100%", maxWidth: "260px", aspectRatio: "960 / 1600" }}>
              <Image
                src="/images/size-guide/size-measurement.jpg"
                alt="Body measurement guide illustration"
                fill
                style={{ objectFit: "contain" }}
                sizes="(max-width: 600px) 260px, 320px"
              />
            </div>
          </div>

          {/* Instructions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>How to Take Your Measurements</h4>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted, #666)", lineHeight: 1.5 }}>
              Hold the tape measure comfortably snug (not tight) around your body, wearing light undergarments.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ background: "var(--bg-secondary, #f8f9fa)", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border, #eaeaea)" }}>
                <strong style={{ fontSize: "0.85rem", display: "block", marginBottom: "2px" }}>1. Bust / Chest</strong>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary, #555)", lineHeight: 1.4 }}>
                  Measure around the fullest part of your bust, keeping the measuring tape parallel to the floor.
                </span>
              </div>

              <div style={{ background: "var(--bg-secondary, #f8f9fa)", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border, #eaeaea)" }}>
                <strong style={{ fontSize: "0.85rem", display: "block", marginBottom: "2px" }}>2. Natural Waist</strong>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary, #555)", lineHeight: 1.4 }}>
                  Measure around the narrowest part of your waistline, typically an inch above your belly button.
                </span>
              </div>

              <div style={{ background: "var(--bg-secondary, #f8f9fa)", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border, #eaeaea)" }}>
                <strong style={{ fontSize: "0.85rem", display: "block", marginBottom: "2px" }}>3. Hips</strong>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary, #555)", lineHeight: 1.4 }}>
                  Stand with your feet together and measure around the fullest point of your hips and rear.
                </span>
              </div>

              <div style={{ background: "var(--bg-secondary, #f8f9fa)", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border, #eaeaea)" }}>
                <strong style={{ fontSize: "0.85rem", display: "block", marginBottom: "2px" }}>4. Garment Length</strong>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary, #555)", lineHeight: 1.4 }}>
                  Top length is measured from the high point of the shoulder down to the hem. Bottoms are measured along the outseam from waist to ankle.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Official Image */}
      {activeTab === "image" && (
        <div>
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "1000 / 460",
              background: "var(--bg-secondary, #f9fafb)",
              borderRadius: "10px",
              overflow: "hidden",
              border: "1px solid var(--border, #eaeaea)",
              marginBottom: "14px"
            }}
          >
            <Image
              src="/images/size-guide/size-chart.jpg"
              alt="Official Irraya Size Chart"
              fill
              style={{ objectFit: "contain" }}
              sizes="(max-width: 800px) 100vw, 800px"
            />
          </div>
          <div style={{ textAlign: "center" }}>
            <a
              href="/images/size-guide/size-chart.jpg"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
              style={{ fontSize: "0.8rem", padding: "6px 14px" }}
            >
              Open Scanned Image in New Tab
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
