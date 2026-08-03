"use client";

import React, { useState, useEffect } from "react";

interface CarouselProps {
  items: React.ReactNode[];
  autoPlay?: boolean;
  interval?: number;
}

export function Carousel({ items, autoPlay = false, interval = 5000 }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval, items.length]);

  const next = () => setCurrentIndex((prev) => (prev + 1) % items.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);

  if (!items || items.length === 0) return null;

  return (
    <div style={{ position: "relative", width: "100%", overflow: "hidden", borderRadius: "var(--radius-lg)" }}>
      <div 
        style={{ 
          display: "flex", 
          transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)", 
          transform: `translateX(-${currentIndex * 100}%)`,
          height: "100%"
        }}
      >
        {items.map((item, index) => (
          <div key={index} style={{ minWidth: "100%", flexShrink: 0, height: "100%" }}>
            {item}
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <>
          <button 
            onClick={prev}
            style={{ 
              position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.8)", border: "none", borderRadius: "50%",
              width: "40px", height: "40px", cursor: "pointer", display: "flex", 
              alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              zIndex: 10
            }}
            aria-label="Previous slide"
          >
            ←
          </button>
          <button 
            onClick={next}
            style={{ 
              position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.8)", border: "none", borderRadius: "50%",
              width: "40px", height: "40px", cursor: "pointer", display: "flex", 
              alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              zIndex: 10
            }}
            aria-label="Next slide"
          >
            →
          </button>
          <div style={{ position: "absolute", bottom: "16px", left: "0", right: "0", display: "flex", justifyContent: "center", gap: "8px", zIndex: 10 }}>
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  width: "8px", height: "8px", borderRadius: "50%", padding: 0,
                  border: "none", background: currentIndex === idx ? "var(--primary)" : "rgba(0,0,0,0.2)",
                  cursor: "pointer", transition: "background 0.2s"
                }}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
