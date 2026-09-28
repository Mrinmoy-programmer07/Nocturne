import "./contract";
import type { ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";
import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import { Transaction } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { deployContract, submitCallTx } from "@midnight-ntwrk/midnight-js-contracts";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { fromHex, validatePassword } from "@midnight-ntwrk/midnight-js-utils";
import { createProofProvider, type MidnightProviders, type PrivateStateExport, type SigningKeyExport } from "@midnight-ntwrk/midnight-js-types";
import { Contract, ledger } from "../../managed/payroll/contract/index.js";
import { Contract as TokenContract, ledger as tokenLedger } from "../../managed/demo-token/contract/index.js";
import { witnesses, type PayrollPrivateState } from "./contract";
import { randomBytes, toHex } from "./payroll";
import { confirmedReceipt, decodeRecipient, hex32, networkSplit } from "./network-input";

const payroll = CompiledContract.make<Contract<PayrollPrivateState>, PayrollPrivateState>("nocturne-payroll", Contract<PayrollPrivateState>).pipe(
  CompiledContract.withWitnesses(witnesses), CompiledContract.withCompiledFileAssets("/contracts/payroll"));
const demoToken = CompiledContract.make<TokenContract<PayrollPrivateState>, PayrollPrivateState>("nocturne-demo-token", TokenContract<PayrollPrivateState>).pipe(
  CompiledContract.withWitnesses({
    issuerSecret: ({ privateState }) => [privateState, privateState.secret],
  }), CompiledContract.withCompiledFileAssets("/contracts/demo-token"));
const stateId = "nocturne-v1";

function emptyState(): PayrollPrivateState {
  return { secret: randomBytes(), coin: { nonce: randomBytes(), color: new Uint8Array(32), value: 0n }, recipients: [], amounts: [] };
}

export async function openNetwork(api: ConnectedAPI, password: string) {
  validatePassword(password);
  const config = await api.getConfiguration();
  if (config.networkId !== "preprod") throw new Error("Switch your wallet to Preprod.");
  setNetworkId("preprod");
  const { shieldedAddress } = await api.getShieldedAddresses();
  const own = decodeRecipient(shieldedAddress);
  const storage = levelPrivateStateProvider<string, PayrollPrivateState>({
    midnightDbName: "nocturne-preprod-v1", accountId: shieldedAddress,
    privateStoragePasswordProvider: () => password,
  });
  const publicDataProvider = indexerPublicDataProvider(
    "https://indexer.preprod.midnight.network/api/v4/graphql",
    "wss://indexer.preprod.midnight.network/api/v4/graphql/ws", window.WebSocket);
  async function providers<K extends string>(name: string): Promise<MidnightProviders<K, string, PayrollPrivateState>> {
    const zkConfigProvider = new FetchZkConfigProvider<K>(new URL(`/contracts/${name}`, window.location.origin).href);
    const provingProvider = await api.getProvingProvider(zkConfigProvider);
    return {
      privateStateProvider: storage, publicDataProvider, zkConfigProvider,
      // Delegate proof generation through the connected wallet's chosen provider.
      proofProvider: createProofProvider(provingProvider),
      walletProvider: {
        getCoinPublicKey: () => own.coinKey,
        getEncryptionPublicKey: () => own.encryptionKey,
        balanceTx: async tx => {
          const result = await api.balanceUnsealedTransaction(toHex(tx.serialize()));
          return Transaction.deserialize("signature", "proof", "binding", fromHex(result.tx));
        },
      },
      midnightProvider: {
        submitTx: async tx => {
          await api.submitTransaction(toHex(tx.serialize()));
          return tx.identifiers()[0];
        },
      },
    };
  }
  const [payrollProviders, tokenProviders] = await Promise.all([
    providers<"pay">("payroll"), providers<"mint">("demo-token")
  ]);

  return {
    async deploy(asset: string) {
      const color = hex32(asset);
      const result = await deployContract(payrollProviders, {
        compiledContract: payroll, privateStateId: stateId,
        initialPrivateState: { ...emptyState(), coin: { nonce: randomBytes(), color, value: 0n } }, args: [color],
      });
      return { contractAddress: result.deployTxData.public.contractAddress, txId: result.deployTxData.public.txId };
    },
    async deployDemoToken() {
      const result = await deployContract(tokenProviders, {
        compiledContract: demoToken, privateStateId: stateId, initialPrivateState: emptyState(),
      });
      return result.deployTxData.public.contractAddress;
    },
    async mintDemoToken(address: string) {
      hex32(address);
      await submitCallTx(tokenProviders, { compiledContract: demoToken, contractAddress: address, privateStateId: stateId, circuitId: "mint" });
      const state = await publicDataProvider.queryContractState(address);
      if (!state) throw new Error("Token state not found.");
      return toHex(tokenLedger(state.data).token);
    },
    async pay(address: string, addresses: [string, string], amounts: [string, string], batchId: string) {
      hex32(address);
      const batch = hex32(batchId);
      const split = networkSplit(addresses, amounts);
      storage.setContractAddress(address);
      const previous = await storage.get(stateId);
      if (!previous) throw new Error("Restore your employer backup for this contract first.");
      const state = await publicDataProvider.queryContractState(address);
      if (!state) throw new Error("Payroll contract not found on Preprod.");
      // If a prior response was lost, check the public batch before attempting a retry.
      if (ledger(state.data).batches.member(batch)) throw new Error("This batch is already recorded on Preprod. Check its transaction before starting another batch.");
      const asset = ledger(state.data).asset;
      const balances = await api.getShieldedBalances();
      if ((balances[toHex(asset)] ?? 0n) < split.total) throw new Error("The connected wallet needs enough shielded tokens for this split.");
      await storage.set(stateId, { ...previous, coin: { nonce: randomBytes(), color: asset, value: split.total }, recipients: split.recipients, amounts: split.amounts });
      try {
        const result = await submitCallTx(payrollProviders, {
          compiledContract: payroll, contractAddress: address, privateStateId: stateId, circuitId: "pay", args: [batch],
          additionalCoinEncPublicKeyMappings: split.encryptionKeys,
        });
        return confirmedReceipt(result.public, address, batchId);
      } finally {
        // Keep the authorization secret, discard payroll details from encrypted storage.
        await storage.set(stateId, { ...previous, recipients: [], amounts: [], coin: { nonce: randomBytes(), color: asset, value: 0n } });
      }
    },
    async backup() {
      return { format: "nocturne-backup-v1", privateStates: await storage.exportPrivateStates(), signingKeys: await storage.exportSigningKeys() };
    },
    async restore(data: { format: string; privateStates: PrivateStateExport; signingKeys: SigningKeyExport }) {
      if (data.format !== "nocturne-backup-v1") throw new Error("Select a Nocturne encrypted backup.");
      await storage.importPrivateStates(data.privateStates, { conflictStrategy: "skip" });
      await storage.importSigningKeys(data.signingKeys, { conflictStrategy: "skip" });
    },
    async lock() { await storage.invalidateEncryptionCache(); },
  };
}

export type NetworkSession = Awaited<ReturnType<typeof openNetwork>>;
export type NetworkReceipt = ReturnType<typeof confirmedReceipt>;
