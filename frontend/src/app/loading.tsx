"use client";

import { useEffect, useState } from "react";

export default function Loading() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Wait 200ms before showing the loading spinner to avoid flashing it on fast page loads
    const timer = setTimeout(() => setShow(true), 200);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "50vh",
      padding: "var(--space-2xl)",
      animation: "pageFadeIn 0.3s ease-out forwards"
    }}>
      <div className="spinner" style={{ 
        width: "40px", 
        height: "40px", 
        borderWidth: "3px", 
        borderColor: "var(--accent) transparent transparent transparent" 
      }}></div>
    </div>
  );
}
