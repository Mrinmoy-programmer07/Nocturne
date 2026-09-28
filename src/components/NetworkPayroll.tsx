import { useRef, useState } from "react";
import type { useMidnight } from "../hooks/useMidnight";
import type { NetworkSession, NetworkReceipt } from "../lib/network";
import { randomBytes, toHex } from "../lib/payroll";
import { downloadJson } from "../lib/download";
import { ArrowRight, LockKeyhole, ArrowDownToLine, Eye, EyeOff } from "lucide-react";
import { validatePassword } from "@midnight-ntwrk/midnight-js-utils";

export default function NetworkPayroll({ wallet, onBusy }: { wallet: ReturnType<typeof useMidnight>; onBusy: (busy: boolean) => void }) {
  const session = useRef<NetworkSession | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [asset, setAsset] = useState("");
  const [tokenContract, setTokenContract] = useState("");
  const [address, setAddress] = useState("");
  const [recipients, setRecipients] = useState<[string, string]>(["", ""]);
  const [amounts, setAmounts] = useState<[string, string]>(["600", "400"]);
  const [batchId, setBatchId] = useState(() => toHex(randomBytes()));
  const [receipt, setReceipt] = useState<NetworkReceipt | null>(null);
  const [busy, setBusy] = useState(false);
  const guard = useRef(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);

  async function action(label: string, fn: () => Promise<void>) {
    if (guard.current) return;
    guard.current = true;
    setBusy(true); onBusy(true); setError(""); setStatus(label);
    console.log(`Starting action: ${label}`);
    try { 
      await fn(); 
      console.log(`Finished action: ${label}`);
    } catch (e) {
      console.error("Action caught error:", e);
      // Wallet and prover errors can embed private inputs. Only show our own safe messages.
      const message = e instanceof Error ? e.message : "";
      setError(/^(Wallet |Invalid |Enter a |Restore your |This batch |The connected wallet |Payroll contract |Switch your |Select a |Payments must |Use two |Each amount |Amounts must)/.test(message)
        ? message : "The operation did not complete. Check the storage password, wallet approval, DUST balance and local proof server. If a payment was submitted, check the same batch before retrying.");
      setStatus("");
    } finally { guard.current = false; setBusy(false); onBusy(false); }
  }

  return <section className="network-workspace" aria-label="Preprod payments">
    <div className="notice"><LockKeyhole size={18} /><p><strong>Preprod payments with 1AM</strong> · Uses test assets and DUST. Contract deployment, proving, balancing and submission require approval from your connected 1AM account.</p></div>
    <div className="network-grid">
      <section className="panel network-panel">
        <div className="panel-heading"><div><span className="section-label">01 / EMPLOYER ACCESS</span><h2>{unlocked ? "Workspace unlocked" : "Unlock private storage"}</h2></div><LockKeyhole size={22} /></div>
        {!unlocked ? <form noValidate onSubmit={e => { e.preventDefault(); void action("Opening encrypted storage...", async () => {
          if (!wallet.api.current) throw new Error("Enter a wallet connection before unlocking storage.");
          try { validatePassword(password); }
          catch { throw new Error("Enter a storage password with at least 16 characters, three character types, and no repeated or sequential pattern."); }
          const { openNetwork } = await import("../lib/network");
          session.current = await openNetwork(wallet.api.current, password);
          setPassword(""); setUnlocked(true); setStatus("Encrypted storage is ready. Create a contract or restore your backup.");
        }); }}>
          <label htmlFor="storage-password">Storage password</label>
          <input id="storage-password" type="password" autoComplete="off" value={password} onChange={e => setPassword(e.target.value)} required minLength={16} />
          <p className="field-hint">At least 16 characters with three character types: uppercase, lowercase, numbers or symbols. Avoid repeated or sequential characters. Keep this password to restore your backup.</p>
          <button className="button primary" type="submit" disabled={busy || !wallet.address}>Unlock storage <ArrowRight size={16} /></button>
          {!wallet.address && <p className="field-hint">Connect your Preprod 1AM Wallet using the button above.</p>}
          {wallet.address ? <p className="field-hint hash">Deployment account: {wallet.address}</p> : null}
          {status ? <p className="field-hint" role="status">{status}</p> : null}
          {error ? <p className="wallet-error" role="alert">{error}</p> : null}
        </form> : <>
          <p className="field-hint">Employer keys are encrypted in this browser. Save a backup after creating a contract. Clearing browser storage without a backup loses access.</p>
          <div className="network-actions">
            <button className="button secondary" disabled={busy} onClick={() => void action("Encrypting backup...", async () => { downloadJson(await session.current!.backup(), "nocturne-private-backup.json"); setStatus("Encrypted backup exported. Keep it and your password private."); })}><ArrowDownToLine size={15} /> Back up keys</button>
            <label className="button secondary file-button">Restore backup<input type="file" accept="application/json" disabled={busy} onChange={e => {
              const file = e.target.files?.[0]; if (!file) return;
              void action("Restoring encrypted backup...", async () => { if (file.size > 2_000_000) throw new Error("Select a backup smaller than 2 MB."); await session.current!.restore(JSON.parse(await file.text())); setStatus("Backup restored. Enter the contract address below."); }); e.target.value = "";
            }} /></label>
          </div>
        </>}
      </section>
      <section className="panel network-panel">
        <div className="panel-heading"><div><span className="section-label">02 / PAYROLL CONTRACT</span><h2>Set up test payroll</h2></div></div>
        <fieldset disabled={!unlocked || busy}>
          <details><summary>Create a demo asset</summary><p className="field-hint">Mint 1,000,000 test units to your connected wallet. The supply is fixed and public. It has no monetary value.</p>
            <button className="button secondary" type="button" onClick={() => void action("Approve demo-token deployment in your wallet...", async () => { const deployed = await session.current!.deployDemoToken(); setTokenContract(deployed); setStatus("Demo token deployed. Back up your keys, then mint its supply."); })}>Deploy demo token</button>
            <label htmlFor="token-contract">Demo-token contract address</label><input id="token-contract" value={tokenContract} onChange={e => setTokenContract(e.target.value.trim())} spellCheck={false} />
            <button className="button secondary" disabled={!tokenContract} onClick={() => void action("Proving and minting demo supply...", async () => { setAsset(await session.current!.mintDemoToken(tokenContract)); setStatus("Demo supply minted. Wait for wallet sync, then deploy payroll."); })}>Mint demo supply</button>
          </details>
          <label htmlFor="asset-color">Shielded token color</label><input id="asset-color" value={asset} onChange={e => setAsset(e.target.value.trim())} placeholder="64 hexadecimal characters" spellCheck={false} />
          <button className="button secondary" disabled={!asset} onClick={() => void action("Approve payroll deployment in your wallet...", async () => { const deployed = await session.current!.deploy(asset); setAddress(deployed.contractAddress); setStatus("Payroll contract deployed. Save its address and export an encrypted backup."); })}>Deploy payroll contract</button>
        </fieldset>
      </section>
      <section className="panel network-panel network-wide">
        <div className="panel-heading"><div><span className="section-label">03 / SHIELDED SPLIT</span><h2>Pay two recipients</h2></div><button className="text-button" onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={15} /> : <Eye size={15} />}{visible ? "Hide amounts" : "Reveal amounts"}</button></div>
        <form onSubmit={e => { e.preventDefault(); void action("Generating proof. Approve the balanced transaction in your wallet, then wait for confirmation...", async () => {
          const result = await session.current!.pay(address, recipients, amounts, batchId);
          setReceipt(result); setVisible(false); setStatus("Payment confirmed by the Preprod indexer. The receipt contains no payout amounts.");
        }); }}>
          <fieldset disabled={!unlocked || busy || Boolean(receipt)}>
            <label htmlFor="payroll-address">Payroll contract address</label><input id="payroll-address" value={address} onChange={e => setAddress(e.target.value.trim())} required spellCheck={false} />
            {[0, 1].map(i => <div className="network-recipient" key={i}>
              <div><label htmlFor={`network-recipient-${i}`}>Recipient {i === 0 ? "A" : "B"} shielded address</label><input id={`network-recipient-${i}`} placeholder="mn_shield-addr_preprod..." value={recipients[i]} onChange={e => setRecipients(prev => prev.map((v, n) => n === i ? e.target.value : v) as [string, string])} required spellCheck={false} autoComplete="off" /></div>
              <div><label htmlFor={`network-amount-${i}`}>Amount in whole units</label><input id={`network-amount-${i}`} type={visible ? "text" : "password"} inputMode="numeric" value={amounts[i]} onChange={e => setAmounts(prev => prev.map((v, n) => n === i ? e.target.value : v) as [string, string])} required autoComplete="off" /></div>
            </div>)}
            <p className="field-hint">Both recipients need a full shielded address, which includes their encryption key. Your wallet must hold the selected shielded asset and enough DUST for fees.</p>
            <label htmlFor="network-batch">Batch ID</label><input id="network-batch" value={batchId} readOnly className="hash" />
            <button className="button primary run-button" type="submit">{busy ? "Waiting for network..." : "Prove and send payroll"}<ArrowRight size={16} /></button>
          </fieldset>
        </form>
        <p className="field-hint">If confirmation is interrupted, keep this batch ID. A retry uses the same ID to prevent paying it twice.</p>
        {receipt && <div className="network-receipt"><h3>Confirmed public receipt</h3><dl><dt>Transaction</dt><dd className="hash">{receipt.txId}</dd><dt>Block</dt><dd>{receipt.blockHeight}</dd><dt>Batch</dt><dd className="hash">{receipt.batchId}</dd></dl><div className="network-actions"><button className="button secondary" onClick={() => downloadJson(receipt, "nocturne-preprod-receipt.json")}>Export public receipt</button><button className="button secondary" onClick={() => { setReceipt(null); setBatchId(toHex(randomBytes())); setStatus(""); }}>Prepare another batch</button></div></div>}
      </section>
    </div>
    {error && <div className="error" role="alert">{error}</div>}
    <div className="status-line" role="status" aria-live="polite">{status || "No network operation is running."}</div>
  </section>;
}
