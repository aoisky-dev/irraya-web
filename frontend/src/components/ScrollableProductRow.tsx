"use client";

import { useRef, useLayoutEffect, useCallback } from "react";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/types";

interface Props {
  products: Product[];
  maxVisible?: number;
}

export function ScrollableProductRow({ products, maxVisible = 5 }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const jumping = useRef(false);

  const items = products.slice(0, 10);
  const visibleCount = Math.min(items.length, maxVisible);

  const scrollBy = useCallback((dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    
    const maxScroll = el.scrollWidth - el.clientWidth;
    const scrollAmount = el.offsetWidth / visibleCount;
    let newScroll = el.scrollLeft + dir * scrollAmount;

    if (dir === 1 && Math.ceil(el.scrollLeft) >= maxScroll) {
      newScroll = 0; // Wrap to start
    } else if (dir === -1 && el.scrollLeft <= 0) {
      newScroll = maxScroll; // Wrap to end
    }
    
    el.scrollTo({ left: newScroll, behavior: "smooth" });
  }, [visibleCount]);

  if (items.length === 0) return null;

  return (
    <div className="scroll-row-wrapper">
      <button className="scroll-arrow scroll-arrow-left" onClick={() => scrollBy(-1)} aria-label="Previous">&#8249;</button>
      <div ref={scrollRef} className="scroll-row">
        {items.map((product, i) => (
          <div
            key={`${product.id}-${i}`}
            className="scroll-row-item"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
      <button className="scroll-arrow scroll-arrow-right" onClick={() => scrollBy(1)} aria-label="Next">&#8250;</button>
    </div>
  );
}
