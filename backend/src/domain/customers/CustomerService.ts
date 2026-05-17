import { AppError } from "../../shared/errors/AppError.js";
import type { Customer } from "./Customer.js";
import type { CustomerRepository } from "./CustomerRepository.js";

export class CustomerService {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async getCustomerByEmail(email: string): Promise<Customer> {
    const customer = await this.customerRepository.findByEmail(email);

    if (!customer) {
      throw new AppError("Customer not found", "CUSTOMER_NOT_FOUND", 404);
    }

    return customer;
  }
}

