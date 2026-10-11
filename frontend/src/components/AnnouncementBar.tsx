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

  useEffect(() => {
    getSales().then((sales) => {
      const active = sales.find((s) => s.active && s.discountPct > 0) ?? null;
      setActiveSale(active);
    }).catch(() => {});
  }, []);

  if (activeSale) {
    const label = activeSale.label || `${activeSale.discountPct}% OFF`;
    const messages = [
      `🔥 SALE — ${label} on selected styles`,
      `Limited time offer · Shop now`,
      `${activeSale.discountPct}% off — no code needed`,
      `🛍️ ${label} · Prices already reduced`,
    ];
    const track = [...messages, ...messages].join("  ·  ");

    return (
      <div className="announcement-bar announcement-bar--sale">
        <div className="announcement-ticker">
          <span className="announcement-track">{track}</span>
        </div>
      </div>
    );
  }

  const track = [...DEFAULT_MESSAGES, ...DEFAULT_MESSAGES].join("  ·  ");
  return (
    <div className="announcement-bar">
      <div className="announcement-ticker">
        <span className="announcement-track">{track}</span>
      </div>
    </div>
  );
}
