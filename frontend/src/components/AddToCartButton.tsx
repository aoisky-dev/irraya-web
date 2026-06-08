"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import { useToast } from "./ToastProvider";

interface AddToCartButtonProps {
  productId: string;
  variantId: string;
  title: string;
  image?: string;
  size: string;
  color: string;
}

export function AddToCartButton({
  productId,
  variantId,
  title,
  image,
  size,
  color
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const { addToast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = async () => {
    setIsAdding(true);
    try {
      await addItem(productId, variantId, 1, { title, image, size, color });
      setIsAdded(true);
      addToast(`Added ${title} to cart`, "success");
      setTimeout(() => setIsAdded(false), 2000);
    } catch {
      addToast("Failed to add item. Please try again.", "error");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <button
      onClick={handleAdd}
      className="btn btn-lg"
      disabled={isAdding}
      style={{ flex: 1 }}
    >
      {isAdding ? "Adding..." : isAdded ? "✓ Added to Cart" : "Add to Cart"}
    </button>
  );
}