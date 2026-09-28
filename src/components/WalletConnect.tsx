import { useMidnight } from "../hooks/useMidnight";
import { Wallet } from "lucide-react";

export function WalletConnect({ wallet, disabled = false }: { wallet: ReturnType<typeof useMidnight>; disabled?: boolean }) {
  return (
    <div className="wallet-control">
      {wallet.address ? (
        <div className="wallet-connected">
          <span title={wallet.address}>{wallet.address.slice(0, 19)}…</span>
          <button className="button secondary" disabled={disabled} onClick={wallet.disconnect}>
            Disconnect
          </button>
        </div>
      ) : (
        <button
          className="button secondary"
          disabled={wallet.busy || disabled}
          onClick={wallet.connect}
        >
          <Wallet size={15} /> {wallet.busy ? "Connecting…" : "Connect 1AM"}
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
