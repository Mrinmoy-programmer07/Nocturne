import * as runtime from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  ledger,
  type Witnesses,
} from "../../managed/payroll/contract/index.js";
import { randomBytes, toHex } from "./payroll";
import { Buffer } from "buffer";

// Compact runtime 0.16.0 uses Buffer when registering shielded commitments.
// Supply the browser implementation before any circuit is executed.
globalThis.Buffer ??= Buffer as typeof globalThis.Buffer;

export interface PayrollPrivateState {
  secret: Uint8Array;
  coin: { nonce: Uint8Array; color: Uint8Array; value: bigint };
  recipients: { bytes: Uint8Array }[];
  amounts: bigint[];
}

export const witnesses: Witnesses<PayrollPrivateState> = {
  employerSecret: ({ privateState }) => [privateState, privateState.secret],
  fundingCoin: ({ privateState }) => [privateState, privateState.coin],
  recipients: ({ privateState }) => [privateState, privateState.recipients],
  amounts: ({ privateState }) => [privateState, privateState.amounts],
};

export const contract = new Contract<PayrollPrivateState>(witnesses);

// This runs the actual compiled circuit locally. No proof or transaction is
// generated. Test coins are synthetic and cannot settle on a network.
export function createLocalSession(state: PayrollPrivateState) {
  const coinPublicKey = toHex(randomBytes());
  const initial = contract.initialState(
    runtime.createConstructorContext(state, coinPublicKey),
    state.coin.color,
  );
  return runtime.createCircuitContext(
    runtime.sampleContractAddress(),
    coinPublicKey,
    initial.currentContractState,
    state,
  );
}

export function runLocalPayroll(
  context: runtime.CircuitContext<PayrollPrivateState>,
  batchId: Uint8Array,
) {
  // Each sandbox batch is a separate local transaction. Preserve the ledger,
  // but do not carry the preceding transaction's output list or commitments.
  const next = runtime.createCircuitContext(
    context.currentQueryContext.block.ownAddress,
    context.currentZswapLocalState.coinPublicKey,
    context.currentQueryContext.state,
    context.currentPrivateState,
    undefined,
    context.costModel,
  );
  const result = contract.impureCircuits.pay(next, batchId);
  const state = ledger(result.context.currentQueryContext.state);
  // Explicit public projection. Never serialize CircuitResults: they contain
  // witness data, private state and unencrypted local shielded coin details.
  return {
    context: result.context,
    receipt: {
      mode: "local-circuit-execution" as const,
      batchId: toHex(batchId),
      batchCount: state.batchCount.toString(),
      asset: toHex(state.asset),
      settled: false as const,
    },
  };
}
