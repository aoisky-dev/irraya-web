import type { Customer } from "../../../domain/customers/Customer.js";
import type { CustomerRepository } from "../../../domain/customers/CustomerRepository.js";

export class InMemoryCustomerRepository implements CustomerRepository {
  private readonly customers = new Map<string, Customer>();

  constructor(seedCustomers: Customer[] = []) {
    for (const customer of seedCustomers) {
      this.customers.set(customer.id, customer);
    }
  }

  async findById(id: string): Promise<Customer | null> {
    return this.customers.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return [...this.customers.values()].find((customer) => customer.email === email) ?? null;
  }

  async save(customer: Customer): Promise<void> {
    this.customers.set(customer.id, customer);
  }
}

