"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getSales, buildSaleMap, type SaleConfig, type SaleMap } from "@/lib/api/sale";

type SaleContextValue = {
  getSale: (productId: string) => SaleConfig | null;
};

const SaleContext = createContext<SaleContextValue>({ getSale: () => null });

export function useSale(): SaleContextValue {
  return useContext(SaleContext);
}

export function SaleProvider({ children }: { children: React.ReactNode }) {
  const [saleMap, setSaleMap] = useState<SaleMap>({});

  useEffect(() => {
    getSales()
      .then(sales => setSaleMap(buildSaleMap(sales)))
      .catch(() => {});
  }, []);

  const getSale = (productId: string): SaleConfig | null => saleMap[productId] ?? null;

  return <SaleContext.Provider value={{ getSale }}>{children}</SaleContext.Provider>;
}
