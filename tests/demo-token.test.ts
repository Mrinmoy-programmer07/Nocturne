import { describe, expect, it } from "vitest";
import * as runtime from "@midnight-ntwrk/compact-runtime";
import { Contract, ledger, type Witnesses } from "../managed/demo-token/contract/index.js";

type State = { secret: Uint8Array };
const secret = new Uint8Array(32).fill(7);
const ownerKey = "33".repeat(32);
const witnesses: Witnesses<State> = { issuerSecret: ({ privateState }) => [privateState, privateState.secret] };

function session(state: State = { secret }) {
  const contract = new Contract<State>(witnesses);
  const initial = contract.initialState(runtime.createConstructorContext(state, ownerKey));
  return { contract, context: runtime.createCircuitContext(runtime.sampleContractAddress(), ownerKey, initial.currentContractState, state) };
}

describe("compiled demo-token circuit", () => {
  it("mints its fixed demo supply once", () => {
    const { contract, context } = session();
    const result = contract.impureCircuits.mint(context);
    const publicState = ledger(result.context.currentQueryContext.state);
    expect(publicState.minted).toBe(true);
    expect(publicState.token).toHaveLength(32);
    expect(result.context.currentZswapLocalState.outputs).toHaveLength(1);
    expect(result.context.currentZswapLocalState.outputs[0].coinInfo.value).toBe(1_000_000n);
  });

  it("rejects an unauthorized issuer", () => {
    const { contract, context } = session();
    expect(() => contract.impureCircuits.mint({ ...context, currentPrivateState: { secret: new Uint8Array(32).fill(8) } })).toThrow(/Issuer only/);
  });

  it("rejects a second mint", () => {
    const { contract, context } = session();
    const first = contract.impureCircuits.mint(context);
    const next = runtime.createCircuitContext(first.context.currentQueryContext.block.ownAddress, ownerKey, first.context.currentQueryContext.state, { secret });
    expect(() => contract.impureCircuits.mint(next)).toThrow(/already minted/);
  });
});
