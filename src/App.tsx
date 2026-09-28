import { lazy, Suspense, useRef, useState, type FormEvent } from "react";
import { useMidnight } from "./hooks/useMidnight";
import type { CircuitContext } from "@midnight-ntwrk/compact-runtime";
import type { PayrollPrivateState, runLocalPayroll } from "./lib/contract";
import { randomBytes, validateSplit } from "./lib/payroll";
import { WalletConnect } from "./components/WalletConnect";
import {
  ArrowDownToLine,
  ArrowUpRight,
  ArrowRight,
  Check,
  CircleDot,
  Eye,
  EyeOff,
  Info,
  LayoutGrid,
  LockKeyhole,
  Moon,
  ShieldCheck,
} from "lucide-react";

type Receipt = ReturnType<typeof runLocalPayroll>["receipt"];
type View = "workspace" | "observer" | "network";
const NetworkPayroll = lazy(() => import("./components/NetworkPayroll"));
const sampleKeys: [string, string] = ["11".repeat(32), "22".repeat(32)];

export default function App() {
  const wallet = useMidnight();
  const [networkBusy, setNetworkBusy] = useState(false);
  const [view, setView] = useState<View>("workspace");
  const [keys, setKeys] = useState<[string, string]>(sampleKeys);
  const [amounts, setAmounts] = useState<[string, string]>(["600", "400"]);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [status, setStatus] = useState("");
  const context = useRef<CircuitContext<PayrollPrivateState> | null>(null);
  const inFlight = useRef(false);

  function updateAmount(index: number, value: string) {
    setAmounts(
      (previous) =>
        previous.map((a, i) => (i === index ? value : a)) as [string, string],
    );
    setStatus("");
  }

  async function run(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    setStatus("Loading the Compact runtime…");
    try {
      const split = validateSplit(keys, amounts);
      const { createLocalSession, runLocalPayroll } =
        await import("./lib/contract");
      const privateState: PayrollPrivateState = {
        secret: context.current?.currentPrivateState.secret ?? randomBytes(),
        coin: {
          nonce: randomBytes(),
          color: new Uint8Array(32).fill(2),
          value: split.total,
        },
        recipients: split.recipients,
        amounts: split.amounts,
      };
      const next = context.current
        ? { ...context.current, currentPrivateState: privateState }
        : createLocalSession(privateState);
      const result = runLocalPayroll(next, randomBytes());
      context.current = result.context;
      setReceipts((previous) => [result.receipt, ...previous]);
      setVisible(false);
      setStatus(
        "Circuit passed. Local receipt created. No proof generated and no funds moved.",
      );
    } catch (e) {
      setStatus("");
      const message = e instanceof Error ? e.message : "";
      setError(
        /positive whole|64-bit|64-character|different recipients/.test(message)
          ? message
          : "Local circuit execution failed. Check your inputs and the compiled contract version.",
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(receipts, null, 2)], {
        type: "application/json",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "nocturne-public-local-receipts.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  function reset() {
    context.current = null;
    setReceipts([]);
    setStatus("Local session cleared.");
    setError("");
    setKeys(sampleKeys);
    setAmounts(["600", "400"]);
    setVisible(false);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="Nocturne home">
          <Moon size={25} strokeWidth={1.5} />
          nocturne<span className="brand-dot">.</span>
        </a>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav aria-label="Workspace">
          <button
            disabled={networkBusy}
            className={view === "workspace" ? "nav-item active" : "nav-item"}
            onClick={() => setView("workspace")}
          >
            <LayoutGrid size={18} /> Payroll{" "}
            <span className="nav-count">02</span>
          </button>
          <button
            disabled={networkBusy}
            className={view === "observer" ? "nav-item active" : "nav-item"}
            onClick={() => {
              setVisible(false);
              setView("observer");
            }}
          >
            <Eye size={18} /> Public observer
          </button>
          <button disabled={networkBusy} className={view === "network" ? "nav-item active" : "nav-item"} onClick={() => setView("network")}><LockKeyhole size={18} /> Preprod payments</button>
          <a className="nav-item" href="#activity">
            <ArrowUpRight size={18} /> Batch activity
          </a>
          <a className="nav-item" href="#privacy">
            <ShieldCheck size={18} /> Privacy model
          </a>
        </nav>
        <div className="sidebar-note">
          <LockKeyhole size={22} />
          <strong>Salary amounts stay private.</strong>
          <p>
            Public records contain batch IDs and counts. Payout amounts stay off
            the contract ledger.
          </p>
          <a
            href="https://docs.midnight.network/"
            target="_blank"
            rel="noreferrer"
          >
            Midnight documentation <ArrowUpRight size={12} />
          </a>
        </div>
        <div className="sidebar-bottom">
          <span className="avatar">N</span>
          <div>
            Nocturne workspace<small>Local sandbox + Preprod</small>
          </div>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span>{" "}
            <strong>
              {view === "workspace" ? "Payroll" : "Public observer"}
            </strong>
          </div>
          <div className="topbar-actions">
            <span className="network">
              <i /> Preprod target
            </span>
            <WalletConnect wallet={wallet} disabled={networkBusy} />
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">PRIVATE PAYROLL / SPLITS</div>
              <h1>
                {view === "network" ? "Send a shielded payroll split." : view === "workspace"
                  ? "Split payroll. Keep amounts private."
                  : "Inspect the public receipt."}
              </h1>
              <p>
                {view === "network" ? "Deploy your payroll contract, prepare two recipients, and confirm payment on Preprod." : view === "workspace"
                  ? "Prepare a two-recipient split and check it against the Midnight contract."
                  : "Batch IDs and execution results, with no salaries or recipient keys."}
              </p>
            </div>
            <span className="level-tag">
              LEVEL 03 <Moon size={26} />
            </span>
          </div>

          {view === "network" ? <Suspense fallback={<p role="status">Loading payments...</p>}><NetworkPayroll key={wallet.address} wallet={wallet} onBusy={setNetworkBusy} /></Suspense> : <>
          <div className="notice">
            <Info size={16} />
            <p>
              <strong>Local circuit sandbox</strong> · Runs the compiled
              Midnight contract with synthetic coins. No ZK proof, network
              transaction, or real payment is created.
            </p>
          </div>

          <section className="stats" aria-label="Payroll summary">
            <div className="stat">
              <span>LOCAL BATCHES</span>
              <strong>
                {String(receipts.length).padStart(2, "0")}
                <small>this session</small>
              </strong>
              <p>
                <span className="tiny-dot" /> Ephemeral · clears on refresh
              </p>
            </div>
            <div className="stat">
              <span>RECIPIENTS PER BATCH</span>
              <strong>
                02<small>fixed split</small>
              </strong>
              <p>Atomic contract execution</p>
            </div>
            <div className="stat privacy-stat">
              <span>AMOUNT VISIBILITY</span>
              <strong>
                Private <LockKeyhole size={22} />
              </strong>
              <p>Excluded from the public ledger</p>
            </div>
          </section>

          <div className="content-grid">
            <section className="panel payroll-panel">
              <div className="panel-heading">
                <div>
                  <span className="section-label">
                    {view === "workspace" ? "01 / PREPARE" : "01 / OBSERVE"}
                  </span>
                  <h2>
                    {view === "workspace"
                      ? "Create a payroll split"
                      : "Public receipt"}
                  </h2>
                </div>
                <span className="pill">
                  {view === "workspace" ? "Employer view" : "Observer view"}
                </span>
              </div>
              {view === "workspace" ? (
                <form onSubmit={run}>
                  <div className="form-meta">
                    <span>PAYROLL ASSET</span>
                    <strong>
                      <span className="token-icon">N</span> TEST · Synthetic
                      token <small>Whole units</small>
                    </strong>
                  </div>
                  <div className="recipients-heading">
                    <h3>Recipients</h3>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setVisible(!visible)}
                    >
                      {visible ? (
                        <>
                          <EyeOff size={14} /> Hide amounts
                        </>
                      ) : (
                        <>
                          <Eye size={14} /> Reveal amounts
                        </>
                      )}
                    </button>
                  </div>
                  <fieldset disabled={busy} className="recipient-fields">
                    <legend className="sr-only">
                      Two recipients and private amounts
                    </legend>
                    {[0, 1].map((i) => (
                      <div className="recipient" key={i}>
                        <div className={`recipient-avatar avatar-${i}`}>
                          {i === 0 ? "A" : "B"}
                        </div>
                        <div className="recipient-details">
                          <label htmlFor={`key-${i}`}>
                            Recipient {i === 0 ? "A" : "B"}
                            <span>Private input</span>
                          </label>
                          <input
                            id={`key-${i}`}
                            aria-label={`Recipient ${i === 0 ? "A" : "B"} coin key`}
                            className="key-input"
                            value={keys[i]}
                            onChange={(e) =>
                              setKeys(
                                (previous) =>
                                  previous.map((key, n) =>
                                    n === i ? e.target.value : key,
                                  ) as [string, string],
                              )
                            }
                            autoComplete="off"
                            spellCheck={false}
                          />
                        </div>
                        <div className="amount-field">
                          <label htmlFor={`amount-${i}`}>Recipient {i === 0 ? "A" : "B"} amount</label>
                          <input
                            id={`amount-${i}`}
                            type={visible ? "text" : "password"}
                            inputMode="numeric"
                            value={amounts[i]}
                            onChange={(e) => updateAmount(i, e.target.value)}
                            autoComplete="off"
                            spellCheck={false}
                          />
                          <span>TEST</span>
                        </div>
                      </div>
                    ))}
                  </fieldset>
                  <p className="field-hint">
                    Sample coin keys are prefilled. Use synthetic inputs only in
                    this sandbox.
                  </p>
                  <div className="total-row">
                    <div>
                      Batch total
                      <small>Visible only in this employer workspace</small>
                    </div>
                    <strong>
                      {visible
                        ? (() => {
                            try {
                              return validateSplit(
                                keys,
                                amounts,
                              ).total.toLocaleString();
                            } catch {
                              return "Invalid";
                            }
                          })()
                        : "••••••"}{" "}
                      <small>TEST</small>
                    </strong>
                  </div>
                  {error && (
                    <div className="error" role="alert">
                      {error}
                    </div>
                  )}
                  <button
                    className="button primary run-button"
                    type="submit"
                    disabled={busy}
                  >
                    {busy ? (
                      <>
                        <span className="spinner" /> Running circuit…
                      </>
                    ) : (
                      <>
                        Run local payroll circuit <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                  <p className="submit-note">
                    Checks authorization, split totals, and duplicate-batch
                    protection.
                  </p>
                </form>
              ) : (
                <div className="observer-body">
                  <Eye className="observer-icon" size={36} />
                  <p>
                    Amounts, recipient keys, and the employer secret are
                    excluded from this view and exported receipts.
                  </p>
                  {receipts[0] ? (
                    <dl>
                      <dt>Batch ID</dt>
                      <dd className="hash">{receipts[0].batchId}</dd>
                      <dt>Execution</dt>
                      <dd>Local circuit passed</dd>
                      <dt>Network settlement</dt>
                      <dd>Not submitted</dd>
                    </dl>
                  ) : (
                    <p className="empty">
                      Run a local batch to inspect its receipt.
                    </p>
                  )}
                  <p className="field-hint">
                    This is a presentation view on the same device, not access
                    control. The employer’s browser still holds private inputs
                    in memory.
                  </p>
                </div>
              )}
              <div className="status-line" role="status" aria-live="polite">
                {status ||
                  "Private inputs are held in memory and cleared on refresh."}
              </div>
            </section>

            <aside className="right-column">
              <section className="privacy-card" id="privacy">
                <ShieldCheck
                  className="privacy-symbol"
                  size={29}
                  strokeWidth={1.5}
                />
                <span className="section-label">WHAT THE CONTRACT CHECKS</span>
                <h2>
                  Authorized sender.{" "}
                  <br />
                  Exact payout total.
                </h2>
                <p>
                  Each split must be funded in full, use two distinct
                  recipients, and have a batch ID that has not been used before.
                </p>
                <div className="privacy-item">
                  <Eye size={17} />
                  <div>
                    <strong>Public</strong>
                    <p>
                      Owner commitment, token type, batch IDs, count, and
                      transaction metadata.
                    </p>
                  </div>
                </div>
                <div className="privacy-item">
                  <LockKeyhole size={17} />
                  <div>
                    <strong>Private</strong>
                    <p>
                      Salary amounts, recipient coin keys, funding details, and
                      employer secret.
                    </p>
                  </div>
                </div>
                <div className="privacy-footnote">
                  The employer sees both payouts. A live recipient should see
                  their own payment. Timing and transaction shape remain
                  observable.
                </div>
              </section>
              <section className="next-card">
                <span className="section-label">NEXT MILESTONE</span>
                <h3>Connect Preprod settlement</h3>
                <p>
                  Wallet funding, proof generation, encrypted recipient outputs,
                  and network confirmation still need integration.
                </p>
                <span className="pending">
                  <CircleDot size={11} /> Network integration pending
                </span>
              </section>
            </aside>
          </div>

          <section className="panel activity" id="activity">
            <div className="panel-heading">
              <div>
                <span className="section-label">02 / ACTIVITY</span>
                <h2>Batch history</h2>
              </div>
              <div className="activity-actions">
                <button
                  className="text-button"
                  disabled={!receipts.length}
                  onClick={download}
                >
                  Export public receipts <ArrowDownToLine size={13} />
                </button>
                <button
                  className="text-button muted"
                  disabled={busy || !receipts.length}
                  onClick={reset}
                >
                  Clear session
                </button>
              </div>
            </div>
            {receipts.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Batch</th>
                      <th>Recipients</th>
                      <th>Amounts</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map((r) => (
                      <tr key={r.batchId}>
                        <td className="mono">
                          {r.batchId.slice(0, 8)}…{r.batchId.slice(-6)}
                        </td>
                        <td>2 recipients</td>
                        <td>
                          •••••• <span className="table-private">Private</span>
                        </td>
                        <td>
                          <span className="success-pill">
                            <Check size={11} /> Circuit passed
                          </span>
                          <small className="table-note">
                            Local only · not settled
                          </small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-history">
                <ArrowUpRight size={22} />
                <div>
                  <strong>No batches in this session</strong>
                  <p>
                    Run the circuit to create a local receipt. No salary amounts
                    will appear here.
                  </p>
                </div>
              </div>
            )}
          </section>
          </>}
          <footer>
            <span>
              <Moon size={14} /> Nocturne / Private Payroll & Splits
            </span>
            <span>Built on Midnight · Level 3 submission build</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
