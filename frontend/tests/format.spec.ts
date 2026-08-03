import { describe, expect, it } from "vitest";
import { formatMoney } from "../src/lib/format";

describe("formatMoney", () => {
  it("formats inr in cents", () => {
    expect(formatMoney(4999, "inr")).toContain("49.99");
  });

  it("formats inr in cents", () => {
    const result = formatMoney(125000, "inr");
    expect(result).toContain("1,250.00");
  });
});

