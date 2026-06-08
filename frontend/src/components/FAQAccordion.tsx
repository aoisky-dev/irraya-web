"use client";

import React, { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div style={{ borderTop: "1px solid var(--border)", marginTop: "var(--space-2xl)" }}>
      {items.map((item, index) => {
        const isActive = activeIndex === index;
        return (
          <div key={index} style={{ borderBottom: "1px solid var(--border)" }}>
            <button
              onClick={() => toggle(index)}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "var(--space-lg) 0",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "1.1rem",
                fontWeight: 500,
                color: "var(--text-primary)"
              }}
              aria-expanded={isActive}
            >
              {item.question}
              <span style={{ fontSize: "1.5rem", transition: "transform 0.2s", transform: isActive ? "rotate(180deg)" : "rotate(0deg)" }}>
                ↓
              </span>
            </button>
            <div 
              style={{
                maxHeight: isActive ? "500px" : "0",
                overflow: "hidden",
                transition: "max-height 0.3s ease-in-out",
              }}
            >
              <div style={{ paddingBottom: "var(--space-lg)", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {item.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
