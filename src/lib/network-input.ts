import { MidnightBech32m, ShieldedAddress } from "@midnight-ntwrk/wallet-sdk-address-format";
import { validateSplit } from "./payroll";

// @ts-ignore
import { bech32m } from "@scure/base";

export function decodeRecipient(value: string) {
  try {
    const val = value.trim();
    const parsed = bech32m.decodeToBytes(val, false);
    if (parsed.prefix !== "mn_shield-addr_preprod" && parsed.prefix !== "mn_shield-addr_testnet") {
      throw new Error(`Invalid prefix: ${parsed.prefix}`);
    }
    if (parsed.bytes.length < 64) throw new Error("Invalid address length.");
    const toHex = (arr: Uint8Array) => Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
    return { 
      coinKey: toHex(parsed.bytes.slice(0, 32)), 
      encryptionKey: toHex(parsed.bytes.slice(32, 64)) 
    };
  } catch (err: any) {
    throw new Error("Enter a complete Preprod shielded address for each recipient.");
  }
}

export function networkSplit(addresses: [string, string], amounts: [string, string]) {
  const recipients = addresses.map(decodeRecipient);
  const split = validateSplit(recipients.map(r => r.coinKey) as [string, string], amounts);
  return { ...split, encryptionKeys: new Map(recipients.map(r => [r.coinKey, r.encryptionKey])) };
}

export function hex32(value: string): Uint8Array {
  if (!/^[0-9a-f]{64}$/i.test(value)) throw new Error("Enter a 64-character hexadecimal contract address or token color.");
  return Uint8Array.from(value.match(/../g)!, pair => parseInt(pair, 16));
}

export function confirmedReceipt(publicData: { status: string; txId: string; blockHeight: number }, contractAddress: string, batchId: string) {
  if (publicData.status !== "SucceedEntirely") throw new Error("The network did not confirm the full payment.");
  return { mode: "preprod" as const, settled: true as const, contractAddress, batchId, txId: publicData.txId, blockHeight: publicData.blockHeight };
}
