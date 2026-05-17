import type { Product } from "../../../domain/products/Product.js";
import type { ProductRepository } from "../../../domain/products/ProductRepository.js";

export class InMemoryProductRepository implements ProductRepository {
  private readonly products = new Map<string, Product>();

  constructor(seedProducts: Product[] = []) {
    for (const product of seedProducts) {
      this.products.set(product.id, product);
    }
  }

  async findAllPublished(): Promise<Product[]> {
    return [...this.products.values()].filter((product) => product.status === "published");
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

