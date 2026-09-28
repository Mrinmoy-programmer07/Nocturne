import { useRef, useState } from "react";
import type { ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";

export function useMidnight() {
  const [address, setAddress] = useState("");
  const [shieldedAddress, setShieldedAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const api = useRef<ConnectedAPI | null>(null);
  const request = useRef(0);

  async function connect() {
    if (busy) return;
    const id = ++request.current;
    setBusy(true);
    setError("");
    try {
      const wallets = Object.values(window.midnight ?? {});
      const wallet = wallets.find(
        (w) => /1\s*am/i.test(w.name) && w.apiVersion?.startsWith("4."),
      );
      if (!wallet)
        throw new Error(
          "Install and unlock 1AM Wallet with DApp Connector v4 support, then retry.",
        );
      const connected = await wallet.connect("preprod");
      const config = await connected.getConfiguration();
      if (config.networkId !== "preprod")
        throw new Error("Switch your wallet to Preprod, then reconnect.");
      const [addresses, unshielded] = await Promise.all([
        connected.getShieldedAddresses(),
        connected.getUnshieldedAddress(),
      ]);
      if (id === request.current) {
        api.current = connected;
        setAddress(unshielded.unshieldedAddress);
        setShieldedAddress(addresses.shieldedAddress);
      }
    } catch (e) {
      if (id === request.current) {
        api.current = null;
        setAddress("");
        setShieldedAddress("");
        // Do not echo opaque wallet errors, which may carry private payloads.
        setError(
          e instanceof Error &&
            /Install and unlock 1AM|Switch your wallet/.test(e.message)
            ? e.message
            : "Wallet connection was declined or unavailable. Unlock your wallet and try again.",
        );
      }
    } finally {
      if (id === request.current) setBusy(false);
    }
  }

  function disconnect() {
    request.current++;
    api.current = null;
    setAddress("");
    setShieldedAddress("");
    setError("");
    setBusy(false);
    // Connector v4 has no revoke method. Remove site permission inside wallet
    // settings to revoke the wallet's remembered authorization as well.
  }

  return { address, shieldedAddress, busy, error, connect, disconnect, api };
}
