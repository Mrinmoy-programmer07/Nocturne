import { useRef, useState } from "react";
import type { ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";

export function useMidnight() {
  const [address, setAddress] = useState("");
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
      const wallet =
        wallets.find(
          (w) => /lace/i.test(w.name) && w.apiVersion?.startsWith("4."),
        ) ?? wallets.find((w) => w.apiVersion?.startsWith("4."));
      if (!wallet)
        throw new Error(
          "Install a Midnight wallet with DApp Connector v4 support, unlock it, then retry.",
        );
      const connected = await wallet.connect("preprod");
      const config = await connected.getConfiguration();
      if (config.networkId !== "preprod")
        throw new Error("Switch your wallet to Preprod, then reconnect.");
      const addresses = await connected.getShieldedAddresses();
      if (id === request.current) {
        api.current = connected;
        setAddress(addresses.shieldedAddress);
      }
    } catch (e) {
      if (id === request.current) {
        api.current = null;
        setAddress("");
        // Do not echo opaque wallet errors, which may carry private payloads.
        setError(
          e instanceof Error &&
            /Install a Midnight|Switch your wallet/.test(e.message)
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
    setError("");
    setBusy(false);
    // Connector v4 has no revoke method. Remove site permission inside wallet
    // settings to revoke the wallet's remembered authorization as well.
  }

  return { address, busy, error, connect, disconnect };
}
