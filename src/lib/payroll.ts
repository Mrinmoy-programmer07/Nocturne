export const MAX_AMOUNT = (1n << 64n) - 1n;

export function parseAmount(value: string): bigint {
  if (!/^[1-9][0-9]*$/.test(value))
    throw new Error("Enter a positive whole number of token units.");
  const amount = BigInt(value);
  if (amount > MAX_AMOUNT) throw new Error("Amount exceeds the 64-bit limit.");
  return amount;
}

export function parseKey(value: string): Uint8Array {
  if (!/^[0-9a-f]{64}$/i.test(value))
    throw new Error("Use a 64-character hexadecimal coin public key.");
  return Uint8Array.from(value.match(/../g)!, (byte) =>
    Number.parseInt(byte, 16),
  );
}

export function toHex(value: Uint8Array): string {
  return Array.from(value, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export function randomBytes(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

export function validateSplit(
  keys: [string, string],
  values: [string, string],
) {
  const recipients = keys.map((key) => ({ bytes: parseKey(key) }));
  if (keys[0].toLowerCase() === keys[1].toLowerCase())
    throw new Error("Choose two different recipients.");
  const amounts = values.map(parseAmount);
  return { recipients, amounts, total: amounts[0] + amounts[1] };
}
