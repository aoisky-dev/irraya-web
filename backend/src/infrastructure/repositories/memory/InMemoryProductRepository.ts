import type { Product } from "../../../domain/products/Product.js";
import type { ProductRepository, ProductFilter } from "../../../domain/products/ProductRepository.js";

export class InMemoryProductRepository implements ProductRepository {
  private readonly products = new Map<string, Product>();

  constructor(seedProducts: Product[] = []) {
    for (const product of seedProducts) {
      this.products.set(product.id, product);
    }
  }

  async findAllPublished(filter?: ProductFilter): Promise<Product[]> {
    let products = [...this.products.values()].filter((product) => product.status === "published");

    if (filter) {
      if (filter.q) {
        const q = filter.q.toLowerCase();
        products = products.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
      }
      if (filter.category) {
        products = products.filter(p => p.category === filter.category);
      }
      if (filter.color) {
        products = products.filter(p => p.variants.some(v => v.color.toLowerCase() === filter.color!.toLowerCase()));
      }
      if (filter.size) {
        products = products.filter(p => p.variants.some(v => v.size.toLowerCase() === filter.size!.toLowerCase()));
      }
      if (filter.minPrice !== undefined) {
        products = products.filter(p => p.variants.some(v => v.priceInCents >= filter.minPrice!));
      }
      if (filter.maxPrice !== undefined) {
        products = products.filter(p => p.variants.some(v => v.priceInCents <= filter.maxPrice!));
      }
    }

    return products;
  }

  async findByHandle(handle: string): Promise<Product | null> {
    return [...this.products.values()].find((product) => product.handle === handle) ?? null;
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.get(id) ?? null;
  }

  async save(product: Product): Promise<void> {
    this.products.set(product.id, product);
  }
}

