import { expect, it } from "vitest";
import {
  MAX_AMOUNT,
  parseAmount,
  parseKey,
  validateSplit,
} from "../src/lib/payroll";

it.each(["0", "-1", "1.5", "1e3", "", " 1", "01", "NaN"])(
  "rejects invalid amount %j",
  (value) => {
    expect(() => parseAmount(value)).toThrow();
  },
);
it("preserves precision above JavaScript safe integer range", () => {
  expect(parseAmount("9007199254740993")).toBe(9007199254740993n);
  expect(parseAmount(MAX_AMOUNT.toString())).toBe(MAX_AMOUNT);
  expect(() => parseAmount((MAX_AMOUNT + 1n).toString())).toThrow();
});
it("rejects malformed keys and case-insensitive duplicates", () => {
  expect(() => parseKey("alice")).toThrow();
  expect(() =>
    validateSplit(["ab".repeat(32), "AB".repeat(32)], ["1", "2"]),
  ).toThrow("different recipients");
});
it("adds two 64-bit amounts in a wider range", () => {
  const split = validateSplit(
    ["ab".repeat(32), "cd".repeat(32)],
    [MAX_AMOUNT.toString(), MAX_AMOUNT.toString()],
  );
  expect(split.total).toBe(MAX_AMOUNT * 2n);
});
