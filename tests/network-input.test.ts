import { describe, expect, it } from "vitest";
import { confirmedReceipt, hex32 } from "../src/lib/network-input";

describe("network receipt boundaries", () => {
  it("accepts exactly 32-byte hexadecimal identifiers", () => {
    expect(hex32("ab".repeat(32))).toEqual(new Uint8Array(32).fill(0xab));
    expect(() => hex32("ab".repeat(31))).toThrow(/64-character/);
  });

  it("creates a settled receipt only after full confirmation", () => {
    expect(confirmedReceipt({ status: "SucceedEntirely", txId: "tx-1", blockHeight: 42 }, "contract", "batch")).toMatchObject({ settled: true, txId: "tx-1", blockHeight: 42 });
    expect(() => confirmedReceipt({ status: "FailEntirely", txId: "tx-2", blockHeight: 43 }, "contract", "batch")).toThrow(/did not confirm/);
  });
});
