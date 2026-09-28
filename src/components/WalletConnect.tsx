import { useMidnight } from "../hooks/useMidnight";
import { Wallet } from "lucide-react";

export function WalletConnect() {
  const wallet = useMidnight();
  return (
    <div className="wallet-control">
      {wallet.address ? (
        <div className="wallet-connected">
          <span title={wallet.address}>{wallet.address.slice(0, 19)}…</span>
          <button className="button secondary" onClick={wallet.disconnect}>
            Disconnect
          </button>
        </div>
      ) : (
        <button
          className="button secondary"
          disabled={wallet.busy}
          onClick={wallet.connect}
        >
          <Wallet size={15} /> {wallet.busy ? "Connecting…" : "Connect wallet"}
        </button>
      )}
      {wallet.error && (
        <p className="wallet-error" role="alert">
          {wallet.error}
        </p>
      )}
    </div>
  );
}
