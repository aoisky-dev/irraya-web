"use client";

import { useState } from "react";
import Image from "next/image";
import { IconInfo, IconCheck } from "@/components/Icons";

export type MeasurementUnit = "in" | "cm";

export const SIZES = ["XXS", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"] as const;

export interface TopsMeasurementRow {
  size: typeof SIZES[number];
  chestIn: string;
  waistIn: string;
  hipIn: string;
  chestCm: string;
  waistCm: string;
  hipCm: string;
}

export const TOPS_DATA: TopsMeasurementRow[] = [
  { size: "XXS", chestIn: "30\"", waistIn: "24\"", hipIn: "34\"", chestCm: "76", waistCm: "61", hipCm: "86" },
  { size: "XS",  chestIn: "32\"", waistIn: "26\"", hipIn: "36\"", chestCm: "81", waistCm: "66", hipCm: "91" },
  { size: "S",   chestIn: "34\"", waistIn: "28\"", hipIn: "38\"", chestCm: "86", waistCm: "71", hipCm: "97" },
  { size: "M",   chestIn: "36\"", waistIn: "30\"", hipIn: "40\"", chestCm: "91", waistCm: "76", hipCm: "102" },
  { size: "L",   chestIn: "38\"", waistIn: "32\"", hipIn: "42\"", chestCm: "97", waistCm: "81", hipCm: "107" },
  { size: "XL",  chestIn: "40\"", waistIn: "34\"", hipIn: "44\"", chestCm: "102", waistCm: "86", hipCm: "112" },
  { size: "2XL", chestIn: "42\"", waistIn: "36\"", hipIn: "46\"", chestCm: "107", waistCm: "91", hipCm: "117" },
  { size: "3XL", chestIn: "44\"", waistIn: "38\"", hipIn: "48\"", chestCm: "112", waistCm: "97", hipCm: "122" },
  { size: "4XL", chestIn: "46\"", waistIn: "40\"", hipIn: "50\"", chestCm: "117", waistCm: "102", hipCm: "127" },
];

export interface BottomsMeasurementRow {
  size: typeof SIZES[number];
  waistIn: string;
  hipsIn: string;
  lengthIn: string;
  waistCm: string;
  hipsCm: string;
  lengthCm: string;
}

export const BOTTOMS_DATA: BottomsMeasurementRow[] = [
  { size: "XXS", waistIn: "24\"", hipsIn: "34\"", lengthIn: "39\" – 40\"", waistCm: "61", hipsCm: "86", lengthCm: "99 – 102" },
  { size: "XS",  waistIn: "26\"", hipsIn: "36\"", lengthIn: "39\" – 40\"", waistCm: "66", hipsCm: "91", lengthCm: "99 – 102" },
  { size: "S",   waistIn: "28\"", hipsIn: "38\"", lengthIn: "39\" – 40\"", waistCm: "71", hipsCm: "97", lengthCm: "99 – 102" },
  { size: "M",   waistIn: "30\"", hipsIn: "40\"", lengthIn: "40\" – 41\"", waistCm: "76", hipsCm: "102", lengthCm: "102 – 104" },
  { size: "L",   waistIn: "32\"", hipsIn: "42\"", lengthIn: "40\" – 41\"", waistCm: "81", hipsCm: "107", lengthCm: "102 – 104" },
  { size: "XL",  waistIn: "34\"", hipsIn: "44\"", lengthIn: "40\" – 41\"", waistCm: "86", hipsCm: "112", lengthCm: "102 – 104" },
  { size: "2XL", waistIn: "36\"", hipsIn: "46\"", lengthIn: "40\" – 41\"", waistCm: "91", hipsCm: "117", lengthCm: "102 – 104" },
  { size: "3XL", waistIn: "38\"", hipsIn: "48\"", lengthIn: "40\" – 41\"", waistCm: "97", hipsCm: "122", lengthCm: "102 – 104" },
  { size: "4XL", waistIn: "40\"", hipsIn: "50\"", lengthIn: "40\" – 41\"", waistCm: "102", hipsCm: "127", lengthCm: "102 – 104" },
];

type SizeGuideContentProps = {
  selectedSize?: string;
  defaultTab?: "chart" | "measure" | "image";
};

export function SizeGuideContent({ selectedSize, defaultTab = "chart" }: SizeGuideContentProps) {
  const [activeTab, setActiveTab] = useState<"chart" | "measure" | "image">(defaultTab);
  const [unit, setUnit] = useState<MeasurementUnit>("in");

  const normalizedSelected = selectedSize
    ? selectedSize.trim().toUpperCase().replace("XXL", "2XL").replace("XXXL", "3XL")
    : undefined;

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
            onClick={() => setActiveTab("chart")}
            style={{
              border: "none",
              background: activeTab === "chart" ? "var(--bg-primary, #ffffff)" : "transparent",
              color: activeTab === "chart" ? "var(--text-primary, #111)" : "var(--text-secondary, #666)",
              fontWeight: activeTab === "chart" ? 600 : 500,
              fontSize: "0.82rem",
              padding: "6px 14px",
              borderRadius: "6px",
              cursor: "pointer",
              boxShadow: activeTab === "chart" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease"
            }}
          >
            Size Table
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
            Chart Graphic
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
        </div>

        {/* Unit Toggle (visible on Table view) */}
        {activeTab === "chart" && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted, #777)", fontWeight: 500 }}>Units:</span>
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
                Inches
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
                CM
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tab 1: Clean Interactive Table */}
      {activeTab === "chart" && (
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
                Your selected size is <strong>{normalizedSelected}</strong> (highlighted in row below).
              </span>
            </div>
          )}

          {/* Women's Tops Table */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-primary, #111)" }}>
                Women&apos;s Tops
              </span>
              <span style={{ fontSize: "0.74rem", color: "var(--text-muted, #777)" }}>
                Measurements in {unit === "in" ? "inches (\")" : "centimeters (cm)"}
              </span>
            </div>

            <div style={{ overflowX: "auto", border: "1px solid var(--border, #eaeaea)", borderRadius: "8px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem", minWidth: "440px" }}>
                <thead>
                  <tr style={{ background: "var(--bg-secondary, #f8f9fa)", borderBottom: "1px solid var(--border, #eaeaea)" }}>
                    <th style={{ textAlign: "center", padding: "10px 14px", fontWeight: 700, width: "20%" }}>SIZE</th>
                    <th style={{ textAlign: "center", padding: "10px 14px", fontWeight: 700, width: "26%" }}>CHEST</th>
                    <th style={{ textAlign: "center", padding: "10px 14px", fontWeight: 700, width: "26%" }}>WAIST</th>
                    <th style={{ textAlign: "center", padding: "10px 14px", fontWeight: 700, width: "28%" }}>HIP</th>
                  </tr>
                </thead>
                <tbody>
                  {TOPS_DATA.map((row, idx) => {
                    const isSelected = row.size === normalizedSelected;
                    return (
                      <tr
                        key={row.size}
                        style={{
                          borderBottom: idx < TOPS_DATA.length - 1 ? "1px solid var(--border, #f0f0f0)" : "none",
                          background: isSelected
                            ? "rgba(225, 29, 72, 0.07)"
                            : idx % 2 === 1
                            ? "var(--bg-secondary, #fafafa)"
                            : "transparent"
                        }}
                      >
                        <td
                          style={{
                            textAlign: "center",
                            padding: "9px 12px",
                            fontWeight: 700,
                            color: isSelected ? "var(--accent-primary, #b91c1c)" : "var(--text-primary, #111)"
                          }}
                        >
                          {row.size}
                          {isSelected && (
                            <span style={{ display: "inline-block", marginLeft: "6px", fontSize: "0.65rem", fontWeight: 600, color: "var(--accent-warm, #e11d48)", textTransform: "uppercase" }}>
                              (Selected)
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: "center", padding: "9px 12px", fontVariantNumeric: "tabular-nums" }}>
                          {unit === "in" ? row.chestIn : row.chestCm}
                        </td>
                        <td style={{ textAlign: "center", padding: "9px 12px", fontVariantNumeric: "tabular-nums" }}>
                          {unit === "in" ? row.waistIn : row.waistCm}
                        </td>
                        <td style={{ textAlign: "center", padding: "9px 12px", fontVariantNumeric: "tabular-nums" }}>
                          {unit === "in" ? row.hipIn : row.hipCm}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p style={{ margin: "6px 0 0 0", fontSize: "0.75rem", color: "var(--text-muted, #777)", fontStyle: "italic" }}>
              * Measurements shown in the size guide refer to body measurements and not measurements of the garment.
            </p>
          </div>

          {/* Women's Bottoms Table */}
          <div style={{ marginBottom: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-primary, #111)" }}>
                Women&apos;s Bottoms
              </span>
              <span style={{ fontSize: "0.74rem", color: "var(--text-muted, #777)" }}>
                Measurements in {unit === "in" ? "inches (\")" : "centimeters (cm)"}
              </span>
            </div>

            <div style={{ overflowX: "auto", border: "1px solid var(--border, #eaeaea)", borderRadius: "8px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem", minWidth: "440px" }}>
                <thead>
                  <tr style={{ background: "var(--bg-secondary, #f8f9fa)", borderBottom: "1px solid var(--border, #eaeaea)" }}>
                    <th style={{ textAlign: "center", padding: "10px 14px", fontWeight: 700, width: "20%" }}>SIZE</th>
                    <th style={{ textAlign: "center", padding: "10px 14px", fontWeight: 700, width: "26%" }}>WAIST</th>
                    <th style={{ textAlign: "center", padding: "10px 14px", fontWeight: 700, width: "26%" }}>HIPS</th>
                    <th style={{ textAlign: "center", padding: "10px 14px", fontWeight: 700, width: "28%" }}>LENGTH</th>
                  </tr>
                </thead>
                <tbody>
                  {BOTTOMS_DATA.map((row, idx) => {
                    const isSelected = row.size === normalizedSelected;
                    return (
                      <tr
                        key={row.size}
                        style={{
                          borderBottom: idx < BOTTOMS_DATA.length - 1 ? "1px solid var(--border, #f0f0f0)" : "none",
                          background: isSelected
                            ? "rgba(225, 29, 72, 0.07)"
                            : idx % 2 === 1
                            ? "var(--bg-secondary, #fafafa)"
                            : "transparent"
                        }}
                      >
                        <td
                          style={{
                            textAlign: "center",
                            padding: "9px 12px",
                            fontWeight: 700,
                            color: isSelected ? "var(--accent-primary, #b91c1c)" : "var(--text-primary, #111)"
                          }}
                        >
                          {row.size}
                          {isSelected && (
                            <span style={{ display: "inline-block", marginLeft: "6px", fontSize: "0.65rem", fontWeight: 600, color: "var(--accent-warm, #e11d48)", textTransform: "uppercase" }}>
                              (Selected)
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: "center", padding: "9px 12px", fontVariantNumeric: "tabular-nums" }}>
                          {unit === "in" ? row.waistIn : row.waistCm}
                        </td>
                        <td style={{ textAlign: "center", padding: "9px 12px", fontVariantNumeric: "tabular-nums" }}>
                          {unit === "in" ? row.hipsIn : row.hipsCm}
                        </td>
                        <td style={{ textAlign: "center", padding: "9px 12px", fontVariantNumeric: "tabular-nums" }}>
                          {unit === "in" ? row.lengthIn : row.lengthCm}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p style={{ margin: "6px 0 0 0", fontSize: "0.75rem", color: "var(--text-muted, #777)", fontStyle: "italic" }}>
              * The length is measured from the navel to the floor.
            </p>
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
              <strong>Fit Advisory:</strong> If you are between sizes, we recommend selecting the larger size for a relaxed and comfortable drape.
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Official Graphic (IMG_6484.jpg) */}
      {activeTab === "image" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "460px",
              aspectRatio: "678 / 1241",
              background: "#ffffff",
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid var(--border, #eaeaea)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
              marginBottom: "14px"
            }}
          >
            <Image
              src="/images/size-guide/size-chart.jpg"
              alt="Official Irraya Size Chart"
              fill
              style={{ objectFit: "contain" }}
              sizes="(max-width: 600px) 100vw, 460px"
              priority
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
              Open Full Resolution Image ↗
            </a>
          </div>
        </div>
      )}

      {/* Tab 3: How to Measure (keeps old measurement diagram as requested) */}
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
              Hold the tape measure comfortably snug (not tight) against your body, wearing light undergarments.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ background: "var(--bg-secondary, #f8f9fa)", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border, #eaeaea)" }}>
                <strong style={{ fontSize: "0.85rem", display: "block", marginBottom: "2px" }}>1. Chest / Bust</strong>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary, #555)", lineHeight: 1.4 }}>
                  Measure around the fullest part of your chest, keeping the tape level across your shoulder blades.
                </span>
              </div>

              <div style={{ background: "var(--bg-secondary, #f8f9fa)", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border, #eaeaea)" }}>
                <strong style={{ fontSize: "0.85rem", display: "block", marginBottom: "2px" }}>2. Natural Waist</strong>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary, #555)", lineHeight: 1.4 }}>
                  Measure around the narrowest part of your waistline, typically where your torso naturally creases.
                </span>
              </div>

              <div style={{ background: "var(--bg-secondary, #f8f9fa)", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border, #eaeaea)" }}>
                <strong style={{ fontSize: "0.85rem", display: "block", marginBottom: "2px" }}>3. Hips</strong>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary, #555)", lineHeight: 1.4 }}>
                  Stand with your feet together and measure around the fullest point of your hips and seat.
                </span>
              </div>

              <div style={{ background: "var(--bg-secondary, #f8f9fa)", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border, #eaeaea)" }}>
                <strong style={{ fontSize: "0.85rem", display: "block", marginBottom: "2px" }}>4. Bottom Length</strong>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary, #555)", lineHeight: 1.4 }}>
                  Measured vertically from the navel down to the floor.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
