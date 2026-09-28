import { MidnightBech32m, ShieldedAddress } from "@midnight-ntwrk/wallet-sdk-address-format";
import { validateSplit } from "./payroll";

export function decodeRecipient(value: string) {
  try {
    const address = MidnightBech32m.parse(value.trim()).decode(ShieldedAddress, "preprod");
    return { coinKey: address.coinPublicKey.toHexString(), encryptionKey: address.encryptionPublicKey.toHexString() };
  } catch {
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
