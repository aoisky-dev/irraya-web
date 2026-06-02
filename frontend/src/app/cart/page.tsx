"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatMoney } from "@/lib/format";

export default function CartPage() {
  const { cart, isLoading, removeItem, updateQuantity, itemMeta } = useCart();

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner" />
        Loading your cart...
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="cart-empty">
        <h1>Your cart is empty</h1>
        <p>Looks like you haven&apos;t added anything to your cart yet.</p>
        <Link href="/products" className="btn">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <section>
      <h1 className="page-title">Shopping Cart</h1>
      <p className="page-subtitle">
        {cart.items.length} {cart.items.length === 1 ? "item" : "items"} in your cart
      </p>

      <div className="cart-layout">
        {/* Cart Items */}
        <div className="cart-items">
          {cart.items.map((item) => {
            const meta = itemMeta.get(item.variantId);
            return (
              <div key={item.id} className="cart-item">
                <div className="cart-item-image">
                  {meta?.image ? (
                    <img src={meta.image} alt={meta.title || "Product"} />
                  ) : (
                    <div className="card-image-placeholder" style={{ height: "100%", fontSize: "1rem" }}>✦</div>
                  )}
                </div>
                <div className="cart-item-info">
                  <h3>{meta?.title || "Product"}</h3>
                  <p className="cart-item-variant">
                    {meta?.size && `Size: ${meta.size}`}
                    {meta?.size && meta?.color && " · "}
                    {meta?.color && `Color: ${meta.color}`}
                  </p>
                  <p className="cart-item-price">
                    {formatMoney(item.unitPriceInCents, cart.currencyCode)} each
                  </p>
                </div>
                <div className="cart-item-actions">
                  <div className="quantity-control">
                    <button
                      className="btn-icon"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="quantity-display">{item.quantity}</span>
                    <button
                      className="btn-icon"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="btn-icon btn-danger"
                    onClick={() => removeItem(item.id)}
                    title="Remove item"
                    aria-label="Remove item"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="cart-summary">
          <h2>Order Summary</h2>
          <div className="summary-row">
            <span className="text-secondary">Subtotal</span>
            <span>{formatMoney(cart.subtotalInCents, cart.currencyCode)}</span>
          </div>
          <div className="summary-row">
            <span className="text-secondary">Shipping</span>
            <span className="text-accent">Free</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>{formatMoney(cart.totalInCents, cart.currencyCode)}</span>
          </div>
          <Link href="/checkout" className="btn btn-full mt-lg">
            Proceed to Checkout
          </Link>
          <Link
            href="/products"
            className="btn btn-secondary btn-full mt-md"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </section>
  );
}
