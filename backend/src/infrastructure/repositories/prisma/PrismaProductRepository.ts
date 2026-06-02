import { PrismaClient } from "@prisma/client";
import type { Product, ProductStatus } from "../../../domain/products/Product.js";
import type { ProductRepository } from "../../../domain/products/ProductRepository.js";

export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAllPublished(): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: {
        status: "published",
      },
      include: {
        variants: true,
      },
    });

    return products.map((p) => this.mapToDomain(p));
  }

  async findByHandle(handle: string): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({
      where: { handle },
      include: { variants: true },
    });

    if (!product) return null;
    return this.mapToDomain(product);
  }

  async findById(id: string): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!product) return null;
    return this.mapToDomain(product);
  }

  async save(product: Product): Promise<void> {
    const { id, handle, title, description, category, status, variants } = product;

    // We'll use Prisma's upsert to seamlessly create or update the product and its variants
    await this.prisma.product.upsert({
      where: { id },
      update: {
        handle,
        title,
        description,
        category,
        status,
        image: "", // To satisfy Prisma model if not provided directly
        variants: {
          upsert: variants.map((v) => ({
            where: { id: v.id },
            update: {
              sku: v.sku,
              size: v.size,
              color: v.color,
              priceInCents: v.priceInCents,
              stock: v.stock,
            },
            create: {
              id: v.id,
              sku: v.sku,
              size: v.size,
              color: v.color,
              priceInCents: v.priceInCents,
              stock: v.stock,
            },
          })),
        },
      },
      create: {
        id,
        handle,
        title,
        description,
        category,
        status,
        image: "", 
        variants: {
          create: variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            size: v.size,
            color: v.color,
            priceInCents: v.priceInCents,
            stock: v.stock,
          })),
        },
      },
    });
  }

  // internal helper to map a prisma object with associated variants to our domain Product
  private mapToDomain(prismaProduct: any): Product {
    return {
      id: prismaProduct.id,
      handle: prismaProduct.handle,
      title: prismaProduct.title,
      description: prismaProduct.description,
      category: prismaProduct.category,
      status: prismaProduct.status as ProductStatus,
      image: prismaProduct.image || undefined,
      variants: prismaProduct.variants.map((v: any) => ({
        id: v.id,
        sku: v.sku,
        size: v.size,
        color: v.color,
        priceInCents: v.priceInCents,
        stock: v.stock,
      })),
      metadata: {},
    };
  }
}
