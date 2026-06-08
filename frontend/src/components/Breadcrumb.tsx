import Link from "next/link";
import React from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" style={{ marginBottom: "var(--space-md)" }}>
      <ol style={{ display: "flex", alignItems: "center", listStyle: "none", padding: 0, margin: 0, gap: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {item.href && !isLast ? (
                <Link href={item.href} style={{ color: "var(--text-secondary)", textDecoration: "none", transition: "color 0.2s" }} onMouseOver={(e) => e.currentTarget.style.color = "var(--text-primary)"} onMouseOut={(e) => e.currentTarget.style.color = "var(--text-secondary)"}>
                  {item.label}
                </Link>
              ) : (
                <span style={{ color: isLast ? "var(--text-primary)" : "inherit", fontWeight: isLast ? 500 : 400 }} aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span aria-hidden="true" style={{ opacity: 0.5 }}>/</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
