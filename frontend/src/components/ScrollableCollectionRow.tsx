"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";

interface CollectionItem {
  category: string;
  image?: string;
  count: number;
}

interface Props {
  collections: CollectionItem[];
}

export function ScrollableCollectionRow({ collections }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const items = collections.slice(0, 10);
  if (items.length === 0) return null;

  const canCycle = items.length > 1;

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    // Measure the actual rendered card width instead of assuming a fixed
    // "2 visible" layout — `.scroll-row-item-collection` shows 1 card per
    // row on mobile, so a hardcoded divisor made the arrows scroll by only
    // half a screen-width there, making them feel broken vs. swipe.
    const firstItem = el.firstElementChild as HTMLElement | null;
    const scrollAmount = firstItem?.offsetWidth || el.offsetWidth / Math.min(items.length, 2);
    let newScroll = el.scrollLeft + dir * scrollAmount;

    if (dir === 1 && Math.ceil(el.scrollLeft) >= maxScroll) {
      newScroll = 0; // Wrap to start
    } else if (dir === -1 && el.scrollLeft <= 0) {
      newScroll = maxScroll; // Wrap to end
    }

    el.scrollTo({ left: newScroll, behavior: "smooth" });
  };


  return (
    <div className="scroll-row-wrapper">
      {canCycle && (
        <button className="scroll-arrow scroll-arrow-left" onClick={() => scrollBy(-1)} aria-label="Previous">&#8249;</button>
      )}
      <div ref={scrollRef} className="scroll-row" style={{ marginBottom: 0 }}>
        {items.map((item, i) => (
          <Link
            key={`${item.category}-${i}`}
            href={`/products?category=${item.category}`}
            className="collection-card scroll-row-item-collection"
            style={{ position: "relative", display: "block" }}
          >
            {item.image && (
              <Image
                src={item.image}
                alt={item.category}
                fill
                style={{ objectFit: "cover" }}
                sizes="50vw"
              />
            )}
            <div className="collection-card-overlay">
              <span className="collection-card-title">{item.category}</span>
              <span className="collection-card-count">{item.count} items</span>
            </div>
          </Link>
        ))}
      </div>
      {canCycle && (
        <button className="scroll-arrow scroll-arrow-right" onClick={() => scrollBy(1)} aria-label="Next">&#8250;</button>
      )}
    </div>
  );
}
