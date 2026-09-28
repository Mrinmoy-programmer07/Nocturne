import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  employerSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  fundingCoin(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, { nonce: Uint8Array,
                                                                            color: Uint8Array,
                                                                            value: bigint
                                                                          }];
  recipients(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, { bytes: Uint8Array
                                                                         }[]];
  amounts(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint[]];
}

export type ImpureCircuits<PS> = {
  pay(context: __compactRuntime.CircuitContext<PS>, batchId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  pay(context: __compactRuntime.CircuitContext<PS>, batchId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  pay(context: __compactRuntime.CircuitContext<PS>, batchId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly owner: Uint8Array;
  readonly asset: Uint8Array;
  batches: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  readonly batchCount: bigint;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               token_0: Uint8Array): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
