import { AppError } from "../../shared/errors/AppError.js";
import type { Product } from "./Product.js";
import type { ProductRepository } from "./ProductRepository.js";

export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async listPublishedProducts(): Promise<Product[]> {
    return this.productRepository.findAllPublished();
  }

  async getProductByHandle(handle: string): Promise<Product> {
    const product = await this.productRepository.findByHandle(handle);

    if (!product || product.status !== "published") {
      throw new AppError("Product not found", "PRODUCT_NOT_FOUND", 404);
    }

    return product;
  }
}

