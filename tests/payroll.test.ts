import { describe, expect, it } from "vitest";
import { ledger } from "../managed/payroll/contract/index.js";
import {
  contract,
  createLocalSession,
  runLocalPayroll,
  type PayrollPrivateState,
} from "../src/lib/contract";

const key = (n: number) => new Uint8Array(32).fill(n);
const fixture = (): PayrollPrivateState => ({
  secret: key(73),
  coin: { nonce: key(99), color: key(2), value: 1000n },
  recipients: [{ bytes: key(11) }, { bytes: key(22) }],
  amounts: [600n, 400n],
});

describe("compiled Compact payroll circuit", () => {
  it("initializes the public owner and asset without exposing the secret", () => {
    const ctx = createLocalSession(fixture());
    const state = ledger(ctx.currentQueryContext.state);
    expect(state.owner).not.toEqual(fixture().secret);
    expect(state.asset).toEqual(key(2));
    expect(state.batchCount).toBe(0n);
  });

  it("executes an exactly funded split and records a public batch", () => {
    const result = runLocalPayroll(createLocalSession(fixture()), key(4));
    const state = ledger(result.context.currentQueryContext.state);
    expect(state.batchCount).toBe(1n);
    expect(state.batches.member(key(4))).toBe(true);
    expect(result.receipt.settled).toBe(false);
    const outputs = result.context.currentZswapLocalState.outputs.filter(
      (output) => output.recipient.is_left,
    );
    expect(outputs.map((output) => output.coinInfo.value)).toEqual([
      600n,
      400n,
    ]);
    expect(outputs.map((output) => output.recipient.left.bytes)).toEqual([
      key(11),
      key(22),
    ]);
    expect(
      outputs.every((output) =>
        Buffer.from(output.coinInfo.color).equals(Buffer.from(key(2))),
      ),
    ).toBe(true);
    expect(outputs[0].coinInfo.nonce).not.toEqual(outputs[1].coinInfo.nonce);
  });

  it("rejects duplicate batch IDs", () => {
    const { context } = runLocalPayroll(createLocalSession(fixture()), key(4));
    expect(() => runLocalPayroll(context, key(4))).toThrow(
      "Batch already paid",
    );
  });

  it("keeps ledger history but isolates each batch's local outputs", () => {
    const first = runLocalPayroll(createLocalSession(fixture()), key(4));
    first.context.currentPrivateState.coin.nonce = key(100);
    const second = runLocalPayroll(first.context, key(5));
    expect(second.receipt.batchCount).toBe("2");
    const outputs = second.context.currentZswapLocalState.outputs.filter(o => o.recipient.is_left);
    expect(outputs.map(o => o.coinInfo.value)).toEqual([600n, 400n]);
    expect(ledger(second.context.currentQueryContext.state).batches.member(key(4))).toBe(true);
  });

  it("rejects an unauthorized employer", () => {
    const ctx = createLocalSession(fixture());
    ctx.currentPrivateState = { ...fixture(), secret: key(74) };
    expect(() => runLocalPayroll(ctx, key(4))).toThrow("Only the employer");
  });

  it.each([999n, 1001n])("rejects mismatched funding of %s", (value) => {
    const ps = fixture();
    ps.coin.value = value;
    expect(() => runLocalPayroll(createLocalSession(ps), key(4))).toThrow(
      "Funding must exactly equal",
    );
  });

  it("rejects a different token", () => {
    const ctx = createLocalSession(fixture());
    ctx.currentPrivateState = {
      ...fixture(),
      coin: { ...fixture().coin, color: key(3) },
    };
    expect(() => runLocalPayroll(ctx, key(4))).toThrow("Wrong payroll asset");
  });

  it("rejects zero payments", () => {
    const ps = fixture();
    ps.amounts = [0n, 1000n];
    expect(() => runLocalPayroll(createLocalSession(ps), key(4))).toThrow(
      "Payments must be positive",
    );
  });

  it("rejects duplicate recipients", () => {
    const ps = fixture();
    ps.recipients[1] = ps.recipients[0];
    expect(() => runLocalPayroll(createLocalSession(ps), key(4))).toThrow(
      "Recipients must be distinct",
    );
  });

  it("exposes only the documented ledger schema and empty circuit return", () => {
    const call = contract.impureCircuits.pay(
      createLocalSession(fixture()),
      key(4),
    );
    expect(call.result).toEqual([]);
    expect(
      Object.keys(ledger(call.context.currentQueryContext.state)).sort(),
    ).toEqual(["asset", "batchCount", "batches", "owner"]);
    // The public entrypoint arguments contain only the random batch identifier.
    expect(call.proofData.input.value).toEqual([key(4)]);
  });

  it("exports a receipt without private amounts, keys, coin or secret", () => {
    const { receipt } = runLocalPayroll(createLocalSession(fixture()), key(4));
    expect(Object.keys(receipt).sort()).toEqual([
      "asset",
      "batchCount",
      "batchId",
      "mode",
      "settled",
    ]);
    expect(JSON.stringify(receipt)).not.toContain("600");
    expect(JSON.stringify(receipt)).not.toContain("400");
  });

  it("excludes raw witness values from public transcript operations", () => {
    const ps = fixture();
    const call = contract.impureCircuits.pay(createLocalSession(ps), key(4));
    const byteValues: Uint8Array[] = [];
    function walk(value: unknown) {
      if (value instanceof Uint8Array) {
        byteValues.push(value);
        return;
      }
      if (value && typeof value === "object")
        Object.values(value).forEach(walk);
    }
    walk(call.proofData.publicTranscript);
    expect(byteValues.length).toBeGreaterThan(0);
    for (const sensitive of [
      ps.secret,
      ps.coin.nonce,
      ...ps.recipients.map((r) => r.bytes),
    ]) {
      expect(
        byteValues.some((value) =>
          Buffer.from(value).equals(Buffer.from(sensitive)),
        ),
      ).toBe(false);
    }
    // Compact unsigned integers are little-endian value atoms. Check both the
    // atomic trimmed encoding and full 8/16-byte encodings, not JSON substrings.
    for (const amount of [600n, 400n, 1000n]) {
      for (const width of [2, 8, 16]) {
        const encoded = new Uint8Array(width);
        let rest = amount;
        for (let i = 0; i < width; i++) {
          encoded[i] = Number(rest & 255n);
          rest >>= 8n;
        }
        expect(
          byteValues.some((value) =>
            Buffer.from(value).equals(Buffer.from(encoded)),
          ),
        ).toBe(false);
      }
    }
  });
});
