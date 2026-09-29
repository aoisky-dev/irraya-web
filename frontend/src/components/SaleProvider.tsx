"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getSaleConfig, type SaleConfig } from "@/lib/api/sale";

const SaleContext = createContext<SaleConfig>({ active: false, discountPct: 0 });

export function useSale(): SaleConfig {
  return useContext(SaleContext);
}

export function SaleProvider({ children }: { children: React.ReactNode }) {
  const [sale, setSale] = useState<SaleConfig>({ active: false, discountPct: 0 });

  useEffect(() => {
    getSaleConfig().then(setSale).catch(() => {});
  }, []);

  return <SaleContext.Provider value={sale}>{children}</SaleContext.Provider>;
}
