"use client";

import { useEffect, useState } from "react";
import { getSales, buildSaleMap } from "@/lib/api/sale";
import type { SaleConfig } from "@/lib/api/sale";

const DEFAULT_MESSAGES = [
  "Free shipping on all orders",
  "New collection now live",
  "Handcrafted with care · Made to last",
];

export function AnnouncementBar() {
  const [activeSale, setActiveSale] = useState<SaleConfig | null>(null);
  // Tracks whether the sales API call has resolved.
  // We wait before rendering so the bar doesn't flash from default → sale colours.
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getSales().then((sales) => {
      const active = sales.find((s) => s.active && s.discountPct > 0) ?? null;
      setActiveSale(active);
    }).catch(() => {}).finally(() => {
      setLoaded(true);
    });
  }, []);

  // Invisible placeholder keeps header height stable while the API resolves.
  // Without this the header shifts down when the bar suddenly appears.
  if (!loaded) {
    return <div className="announcement-bar" style={{ visibility: "hidden" }} aria-hidden="true" />;
  }

  if (activeSale) {
    const label = activeSale.label || `${activeSale.discountPct}% OFF`;
    const name = activeSale.name;

    // Build urgency / end-date message
    let endMsg = "Limited time · Shop now";
    if (activeSale.endsAt) {
      const end = new Date(activeSale.endsAt);
      const hoursLeft = (end.getTime() - Date.now()) / 3_600_000;
      if (hoursLeft < 24) {
        const h = Math.ceil(hoursLeft);
        endMsg = `⏰ Ends in ${h} hour${h !== 1 ? "s" : ""}! Grab it now`;
      } else {
        endMsg = `⏰ Sale ends ${end.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} — don't miss out`;
      }
    }

    const messages = [
      `🔥 ${name} — ${label}`,
      endMsg,
      `${label} · No code needed`,
      `🛍️ ${name} · Prices already reduced`,
    ];
    // Single copy per track — the two-track CSS loop with translateX(-50%) provides the seamless repeat
    const trackContent = messages.join("   ✦   ");

    return (
      <div className="announcement-bar announcement-bar--sale">
        <div className="announcement-ticker">
          <div className="announcement-track">
            <span>{trackContent}</span>
            <span aria-hidden="true" style={{ padding: "0 1.5rem" }}>✦</span>
          </div>
          <div className="announcement-track" aria-hidden="true">
            <span>{trackContent}</span>
            <span aria-hidden="true" style={{ padding: "0 1.5rem" }}>✦</span>
          </div>
        </div>
      </div>
    );
  }

  // Single copy per track — the two-track CSS loop with translateX(-50%) provides the seamless repeat
  const trackContent = DEFAULT_MESSAGES.join("   ✦   ");
  return (
    <div className="announcement-bar">
      <div className="announcement-ticker">
        <div className="announcement-track">
          <span>{trackContent}</span>
          <span aria-hidden="true" style={{ padding: "0 1.5rem" }}>✦</span>
        </div>
        <div className="announcement-track" aria-hidden="true">
          <span>{trackContent}</span>
          <span aria-hidden="true" style={{ padding: "0 1.5rem" }}>✦</span>
        </div>
      </div>
    </div>
  );
}
