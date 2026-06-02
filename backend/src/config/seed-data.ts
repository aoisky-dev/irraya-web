import type { Product } from "../domain/products/Product.js";

/**
 * Rich seed catalog for in-memory mode.
 * 8 products across 5 categories with multiple variants each.
 */
export const seedProducts: Product[] = [
  {
    id: "prod_hoodie_001",
    handle: "urban-hoodie",
    title: "Urban Hoodie",
    description:
      "Premium heavyweight French terry cotton hoodie for all-day comfort. Features a kangaroo pocket, adjustable drawstring hood, and ribbed cuffs. Enzyme-washed for a soft, lived-in feel from day one.",
    category: "hoodies",
    status: "published",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80",
    variants: [
      { id: "var_hoodie_blk_s", sku: "UH-BLK-S", size: "S", color: "Black", priceInCents: 399920, stock: 12 },
      { id: "var_hoodie_blk_m", sku: "UH-BLK-M", size: "M", color: "Black", priceInCents: 399920, stock: 25 },
      { id: "var_hoodie_blk_l", sku: "UH-BLK-L", size: "L", color: "Black", priceInCents: 399920, stock: 18 },
      { id: "var_hoodie_gry_m", sku: "UH-GRY-M", size: "M", color: "Charcoal", priceInCents: 399920, stock: 15 },
      { id: "var_hoodie_gry_l", sku: "UH-GRY-L", size: "L", color: "Charcoal", priceInCents: 399920, stock: 10 }
    ],
    metadata: { material: "100% Organic Cotton", care: "Machine wash cold, tumble dry low." },
    rating: 4.8,
    reviewsCount: 124
  },
  {
    id: "prod_tshirt_001",
    handle: "classic-white-tee",
    title: "Classic White T-Shirt",
    description:
      "A wardrobe essential crafted from organic Pima cotton with a relaxed silhouette. Pre-shrunk and garment-dyed for a perfect fit that only gets better with every wash. Lightweight and breathable.",
    category: "t-shirts",
    status: "published",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
    variants: [
      { id: "var_tshirt_wht_s", sku: "TS-WHT-S", size: "S", color: "White", priceInCents: 200000, stock: 30 },
      { id: "var_tshirt_wht_m", sku: "TS-WHT-M", size: "M", color: "White", priceInCents: 200000, stock: 45 },
      { id: "var_tshirt_wht_l", sku: "TS-WHT-L", size: "L", color: "White", priceInCents: 200000, stock: 35 },
      { id: "var_tshirt_wht_xl", sku: "TS-WHT-XL", size: "XL", color: "White", priceInCents: 200000, stock: 20 }
    ],
    metadata: { material: "Organic Pima Cotton", fit: "Relaxed", care: "Machine wash warm" }
  },
  {
    id: "prod_dress_001",
    handle: "linen-summer-dress",
    title: "Linen Summer Dress",
    description:
      "Breathable and lightweight dress handcrafted from European flax linen. Features a flattering A-line cut with side pockets and mother-of-pearl buttons. Perfect for warm weather — gets softer with every wash.",
    category: "dresses",
    status: "published",
    image: "https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=800&q=80",
    variants: [
      { id: "var_dress_beige_s", sku: "DR-LIN-S", size: "S", color: "Beige", priceInCents: 680000, stock: 8 },
      { id: "var_dress_beige_m", sku: "DR-LIN-M", size: "M", color: "Beige", priceInCents: 680000, stock: 12 },
      { id: "var_dress_beige_l", sku: "DR-LIN-L", size: "L", color: "Beige", priceInCents: 680000, stock: 5 },
      { id: "var_dress_sge_m", sku: "DR-SGE-M", size: "M", color: "Sage", priceInCents: 680000, stock: 7 }
    ],
    metadata: { material: "European Flax Linen", fit: "A-Line", care: "Hand wash or gentle cycle" }
  },
  {
    id: "prod_tshirt_002",
    handle: "midnight-crew-neck",
    title: "Midnight Crew Neck",
    description:
      "A refined take on the crew neck tee. Cut from extra-long staple cotton with a subtle peached finish for unmatched softness. Double-stitched seams and a taped neckline ensure lasting quality.",
    category: "t-shirts",
    status: "published",
    image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&q=80",
    variants: [
      { id: "var_crew_nvy_s", sku: "CN-NVY-S", size: "S", color: "Navy", priceInCents: 232000, stock: 22 },
      { id: "var_crew_nvy_m", sku: "CN-NVY-M", size: "M", color: "Navy", priceInCents: 232000, stock: 30 },
      { id: "var_crew_nvy_l", sku: "CN-NVY-L", size: "L", color: "Navy", priceInCents: 232000, stock: 28 },
      { id: "var_crew_blk_m", sku: "CN-BLK-M", size: "M", color: "Black", priceInCents: 232000, stock: 35 }
    ],
    metadata: { material: "Extra-Long Staple Cotton", fit: "Slim", care: "Machine wash cold" }
  },
  {
    id: "prod_pants_001",
    handle: "tapered-chinos",
    title: "Tapered Chinos",
    description:
      "Modern tapered chinos made from stretch organic cotton twill. Features a comfortable mid-rise waist, slant pockets, and a clean tapered leg. Versatile enough for office or weekend.",
    category: "pants",
    status: "published",
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80",
    variants: [
      { id: "var_chino_tan_30", sku: "CH-TAN-30", size: "30", color: "Tan", priceInCents: 520000, stock: 14 },
      { id: "var_chino_tan_32", sku: "CH-TAN-32", size: "32", color: "Tan", priceInCents: 520000, stock: 20 },
      { id: "var_chino_tan_34", sku: "CH-TAN-34", size: "34", color: "Tan", priceInCents: 520000, stock: 16 },
      { id: "var_chino_olv_32", sku: "CH-OLV-32", size: "32", color: "Olive", priceInCents: 520000, stock: 12 },
      { id: "var_chino_olv_34", sku: "CH-OLV-34", size: "34", color: "Olive", priceInCents: 520000, stock: 10 }
    ],
    metadata: { material: "Stretch Organic Cotton Twill", fit: "Tapered", care: "Machine wash cold" }
  },
  {
    id: "prod_jacket_001",
    handle: "wool-blend-overcoat",
    title: "Wool Blend Overcoat",
    description:
      "A timeless overcoat crafted from Italian wool blend. Features a single-breasted closure, notched lapels, and a fully lined interior. Designed for layering over both casual and formal outfits.",
    category: "outerwear",
    status: "published",
    image: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800&q=80",
    variants: [
      { id: "var_coat_camel_s", sku: "OC-CML-S", size: "S", color: "Camel", priceInCents: 1480000, stock: 4 },
      { id: "var_coat_camel_m", sku: "OC-CML-M", size: "M", color: "Camel", priceInCents: 1480000, stock: 6 },
      { id: "var_coat_camel_l", sku: "OC-CML-L", size: "L", color: "Camel", priceInCents: 1480000, stock: 3 },
      { id: "var_coat_blk_m", sku: "OC-BLK-M", size: "M", color: "Black", priceInCents: 1480000, stock: 5 }
    ],
    metadata: { material: "100% Linen", care: "Dry clean only." },
    rating: 4.9,
    reviewsCount: 210
  },
  {
    id: "prod_dress_002",
    handle: "silk-wrap-dress",
    title: "Silk Wrap Dress",
    description:
      "Elegant silk wrap dress in a rich burgundy tone. Made from mulberry silk with a smooth, luminous drape. The self-tie waist creates a universally flattering silhouette. Perfect for evening occasions.",
    category: "dresses",
    status: "published",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80",
    variants: [
      { id: "var_silk_brg_s", sku: "SD-BRG-S", size: "S", color: "Burgundy", priceInCents: 1000000, stock: 6 },
      { id: "var_silk_brg_m", sku: "SD-BRG-M", size: "M", color: "Burgundy", priceInCents: 1000000, stock: 9 },
      { id: "var_silk_brg_l", sku: "SD-BRG-L", size: "L", color: "Burgundy", priceInCents: 1000000, stock: 4 },
      { id: "var_silk_blk_m", sku: "SD-BLK-M", size: "M", color: "Black", priceInCents: 1000000, stock: 7 }
    ],
    metadata: { material: "100% Mulberry Silk", care: "Hand wash cold or dry clean." },
    rating: 5.0,
    reviewsCount: 12
  },
  {
    id: "prod_hoodie_002",
    handle: "cashmere-zip-hoodie",
    title: "Cashmere Zip Hoodie",
    description:
      "Luxurious full-zip hoodie crafted from Mongolian cashmere. Incredibly soft and lightweight, with a refined look that elevates casual wear. Features brushed nickel hardware and a lined hood.",
    category: "hoodies",
    status: "published",
    image: "https://images.unsplash.com/photo-1578768079470-49c8e2e8f48c?w=800&q=80",
    variants: [
      { id: "var_cash_oat_s", sku: "CZ-OAT-S", size: "S", color: "Oatmeal", priceInCents: 1272000, stock: 3 },
      { id: "var_cash_oat_m", sku: "CZ-OAT-M", size: "M", color: "Oatmeal", priceInCents: 1272000, stock: 5 },
      { id: "var_cash_oat_l", sku: "CZ-OAT-L", size: "L", color: "Oatmeal", priceInCents: 1272000, stock: 4 },
      { id: "var_cash_gry_m", sku: "CZ-GRY-M", size: "M", color: "Heather Grey", priceInCents: 1272000, stock: 6 }
    ],
    metadata: { material: "Mongolian Cashmere", fit: "Relaxed", care: "Hand wash cold" }
  }
];
