import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomBytes as nodeRandomBytes } from "node:crypto";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import { deployContract, submitCallTx } from "@midnight-ntwrk/midnight-js-contracts";
import {
  FaucetClient,
  MidnightWalletProvider,
  initializeMidnightProviders,
  syncWallet,
  waitForFunds,
} from "@midnight-ntwrk/testkit-js";
import { Contract as PayrollContract } from "../managed/payroll/contract/index.js";
import { Contract as TokenContract, ledger as tokenLedger } from "../managed/demo-token/contract/index.js";
import { witnesses as payrollWitnesses } from "../src/lib/contract.ts";

const env = {
  walletNetworkId: "PreProd",
  networkId: "preprod",
  indexer: "https://indexer.preprod.midnight.network/api/v4/graphql",
  indexerWS: "wss://indexer.preprod.midnight.network/api/v4/graphql/ws",
  node: "https://rpc.preprod.midnight.network",
  nodeWS: "wss://rpc.preprod.midnight.network",
  faucet: "https://faucet.preprod.midnight.network/api/drips",
  proofServer: "http://127.0.0.1:6300",
};
const logger = Object.fromEntries(
  ["trace", "debug", "info", "warn", "error", "fatal"].map((name) => [name, () => undefined]),
);
logger.isLevelEnabled = () => false;
const privateDir = new URL("../.private/", import.meta.url);
const walletFile = new URL("wallet.json", privateDir);
const deploymentFile = new URL("preprod-deployment.json", privateDir);

await mkdir(privateDir, { recursive: true });
let seed;
try {
  seed = JSON.parse(await readFile(walletFile, "utf8")).seed;
} catch {
  seed = nodeRandomBytes(32).toString("hex");
  await writeFile(walletFile, JSON.stringify({ seed }), { mode: 0o600 });
}
if (!/^[0-9a-f]{64}$/.test(seed)) throw new Error("Invalid private wallet file");

setNetworkId("preprod");
const wallet = await MidnightWalletProvider.build(logger, env, seed);
await wallet.start(false);
const unshieldedAddress = wallet.unshieldedKeystore.getBech32Address().asString();
const coinKey = wallet.getCoinPublicKey();
const encryptionKey = wallet.getEncryptionPublicKey();
console.log(`Preprod funding address: ${unshieldedAddress}`);
console.log(`Preprod recipient coin key: ${coinKey}`);

try {
  const faucet = new FaucetClient(env.faucet, logger);
  await faucet.requestTokens(unshieldedAddress);
  console.log("Faucet request accepted; waiting for wallet sync and DUST registration.");
} catch (error) {
  console.log(`Faucet request was not accepted: ${error?.response?.status ?? "unknown status"}`);
}

try {
  const night = await waitForFunds(wallet.wallet, { ...env, faucet: undefined }, false, wallet.unshieldedKeystore);
  if (night <= 0n) throw new Error("No NIGHT received");
  const state = await syncWallet(wallet.wallet);
  if (state.dust.balance(new Date()) <= 0n) throw new Error("DUST is not available yet");

  const initial = () => ({
    secret: new Uint8Array(nodeRandomBytes(32)),
    coin: { nonce: new Uint8Array(nodeRandomBytes(32)), color: new Uint8Array(32), value: 0n },
    recipients: [],
    amounts: [],
  });
  const tokenWitnesses = { issuerSecret: ({ privateState }) => [privateState, privateState.secret] };
  const tokenCompiled = CompiledContract.make("nocturne-demo-token", TokenContract).pipe(
    CompiledContract.withWitnesses(tokenWitnesses),
    CompiledContract.withCompiledFileAssets("managed/demo-token"),
  );
  const tokenProviders = initializeMidnightProviders(wallet, env, {
    privateStateStoreName: "nocturne-preprod-token",
    zkConfigPath: "managed/demo-token",
  });
  console.log("Deploying the demo shielded asset...");
  const tokenDeployment = await deployContract(tokenProviders, {
    compiledContract: tokenCompiled,
    privateStateId: "nocturne-v1",
    initialPrivateState: initial(),
  });
  const tokenAddress = tokenDeployment.deployTxData.public.contractAddress;
  console.log(`Demo-token contract: ${tokenAddress}`);
  const mint = await submitCallTx(tokenProviders, {
    compiledContract: tokenCompiled,
    contractAddress: tokenAddress,
    privateStateId: "nocturne-v1",
    circuitId: "mint",
  });
  const tokenState = await tokenProviders.publicDataProvider.queryContractState(tokenAddress);
  if (!tokenState) throw new Error("Demo-token state was not indexed");
  const color = tokenLedger(tokenState.data).token;

  const payrollCompiled = CompiledContract.make("nocturne-payroll", PayrollContract).pipe(
    CompiledContract.withWitnesses(payrollWitnesses),
    CompiledContract.withCompiledFileAssets("managed/payroll"),
  );
  const payrollProviders = initializeMidnightProviders(wallet, env, {
    privateStateStoreName: "nocturne-preprod-payroll",
    zkConfigPath: "managed/payroll",
  });
  console.log("Deploying the payroll contract...");
  const payrollDeployment = await deployContract(payrollProviders, {
    compiledContract: payrollCompiled,
    privateStateId: "nocturne-v1",
    initialPrivateState: { ...initial(), coin: { nonce: new Uint8Array(nodeRandomBytes(32)), color, value: 0n } },
    args: [color],
  });
  const result = {
    network: "preprod",
    payrollContractAddress: payrollDeployment.deployTxData.public.contractAddress,
    payrollDeployTxId: payrollDeployment.deployTxData.public.txId,
    demoTokenContractAddress: tokenAddress,
    demoTokenDeployTxId: tokenDeployment.deployTxData.public.txId,
    demoTokenMintTxId: mint.public.txId,
    tokenColor: Buffer.from(color).toString("hex"),
    deployerCoinPublicKey: coinKey,
    deployerEncryptionPublicKey: encryptionKey,
  };
  await writeFile(deploymentFile, JSON.stringify(result, null, 2), { mode: 0o600 });
  console.log(JSON.stringify(result, null, 2));
} finally {
  await wallet.stop();
}
