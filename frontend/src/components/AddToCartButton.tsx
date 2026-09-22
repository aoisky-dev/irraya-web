"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { addItem } = useCart();
  const { addToast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

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

  const handleBuyNow = async () => {
    setIsBuying(true);
    try {
      await addItem(productId, variantId, 1, { title, image, size, color });
      router.push("/checkout");
    } catch {
      addToast("Failed to initiate checkout. Please try again.", "error");
      setIsBuying(false);
    }
  };

  return (
    <>
      <button
        onClick={handleAdd}
        className="btn btn-lg"
        disabled={isAdding || isBuying}
        style={{ flex: 1, backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border)", transition: "all 0.2s ease" }}
      >
        {isAdding ? "Adding..." : isAdded ? "✓ Added" : "Add to Cart"}
      </button>
      <button
        onClick={handleBuyNow}
        className="btn btn-lg"
        disabled={isAdding || isBuying}
        style={{ flex: 1 }}
      >
        {isBuying ? "Processing..." : "Buy Now"}
      </button>
    </>
  );
}