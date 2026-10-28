"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getSales, buildSaleMap, type SaleConfig, type SaleMap } from "@/lib/api/sale";

type SaleContextValue = {
  getSale: (productId: string) => SaleConfig | null;
  hasActiveSale: boolean;
  activeSale: SaleConfig | null;
};

const SaleContext = createContext<SaleContextValue>({
  getSale: () => null,
  hasActiveSale: false,
  activeSale: null,
});

export function useSale(): SaleContextValue {
  return useContext(SaleContext);
}

export function SaleProvider({ children }: { children: React.ReactNode }) {
  const [saleMap, setSaleMap] = useState<SaleMap>({});
  const [activeSale, setActiveSale] = useState<SaleConfig | null>(null);

  useEffect(() => {
    getSales()
      .then(sales => {
        setSaleMap(buildSaleMap(sales));
        const active = sales.find((s) => s.active && s.discountPct > 0) ?? null;
        setActiveSale(active);
      })
      .catch(() => {});
  }, []);

  const getSale = (productId: string): SaleConfig | null => saleMap[productId] ?? null;

  return (
    <SaleContext.Provider value={{ getSale, hasActiveSale: Boolean(activeSale), activeSale }}>
      {children}
    </SaleContext.Provider>
  );
}
