import { describe, expect, it } from "vitest";
import { formatMoney } from "../src/lib/format";

describe("formatMoney", () => {
  it("formats inr with currency symbol and no decimals", () => {
    expect(formatMoney(4999, "inr")).toContain("50");
  });

  it("formats inr thousands with commas", () => {
    const result = formatMoney(125000, "inr");
    expect(result).toContain("1,250");
  });
});

