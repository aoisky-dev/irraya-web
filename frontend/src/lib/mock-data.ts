import type { Cart, Product } from "./types";

export const sampleProducts: Product[] = [
  {
    id: "prod_hoodie_001",
    handle: "urban-hoodie",
    title: "Urban Hoodie",
    description: "Premium cotton hoodie for all-day comfort.",
    category: "hoodies",
    status: "published",
    variants: [
      {
        id: "var_hoodie_black_m",
        sku: "UH-BLK-M",
        size: "M",
        color: "Black",
        priceInCents: 4999,
        stock: 25
      }
    ],
    metadata: {
      material: "cotton",
      fit: "regular"
    }
  },
  {
    id: "prod_jacket_002",
    handle: "street-jacket",
    title: "Street Jacket",
    description: "Lightweight style jacket for casual wear.",
    category: "jackets",
    status: "published",
    variants: [
      {
        id: "var_jacket_olive_l",
        sku: "SJ-OLV-L",
        size: "L",
        color: "Olive",
        priceInCents: 7999,
        stock: 12
      }
    ]
  }
];

export const sampleCart: Cart = {
  id: "cart_demo_001",
  customerId: "cus_001",
  currencyCode: "usd",
  items: [
    {
      id: "item_001",
      productId: "prod_hoodie_001",
      variantId: "var_hoodie_black_m",
      quantity: 1,
      unitPriceInCents: 4999
    }
  ],
  subtotalInCents: 4999,
  totalInCents: 4999
};

