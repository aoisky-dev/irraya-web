"use client";

import { useRef, useCallback } from "react";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/types";

interface Props {
  products: Product[];
  maxVisible?: number;
}

export function ScrollableProductRow({ products, maxVisible = 5 }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const items = products.slice(0, 10);

  const scrollBy = useCallback((dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    // Measure the actual rendered width of one item (it changes across
    // breakpoints — e.g. 5 visible on desktop, 2 on mobile — via CSS media
    // queries on `.scroll-row-item`). Using a fixed `maxVisible` here caused
    // the arrows to scroll by a tiny fraction of the screen on mobile,
    // making them appear broken/unresponsive while swipe still worked.
    const firstItem = el.firstElementChild as HTMLElement | null;
    const scrollAmount = firstItem?.offsetWidth || el.offsetWidth / Math.min(items.length, maxVisible);
    let newScroll = el.scrollLeft + dir * scrollAmount;

    if (dir === 1 && Math.ceil(el.scrollLeft) >= maxScroll) {
      newScroll = 0; // Wrap to start
    } else if (dir === -1 && el.scrollLeft <= 0) {
      newScroll = maxScroll; // Wrap to end
    }

    el.scrollTo({ left: newScroll, behavior: "smooth" });
  }, [items.length, maxVisible]);


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
