import { PrismaClient } from "@prisma/client";
import type { Customer } from "../../../domain/customers/Customer.js";
import type { CustomerRepository } from "../../../domain/customers/CustomerRepository.js";

export class PrismaCustomerRepository implements CustomerRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Customer | null> {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) return null;
    return {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone || undefined
    };
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const customer = await this.prisma.customer.findUnique({ where: { email } });
    if (!customer) return null;
    return {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone || undefined
    };
  }

  async save(customer: Customer): Promise<void> {
    await this.prisma.customer.upsert({
      where: { id: customer.id },
      update: {
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone || null
      },
      create: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone || null
      }
    });
  }
}
