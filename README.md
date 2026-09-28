# Nocturne

CI workflow: [Compile and test](.github/workflows/ci.yml). Remote status is pending because this project has not been pushed to GitHub.

> Private Payroll / Splits for two recipients, built with Midnight Compact.

**Current milestone:** compiled contract with proving keys, passing local tests, and a working browser sandbox. This is a Level 3 foundation, not a completed challenge submission or a live payment service.

## Live Demo

Local preview: `http://127.0.0.1:4173` after `npm run build` and `npm run preview`.

Public demo: not deployed. The frontend currently executes the actual compiled circuit with synthetic coins in browser memory. It does not generate a proof, submit a transaction, or transfer funds. Connecting a wallet does not change that mode.

## Contract Address

| Network | Address |
| --- | --- |
| Preprod | Not deployed. No verified address yet. |

## What This Does

An employer prepares a two-recipient payroll split. The Compact contract verifies the employer's secret against its public commitment, checks the token and exact funding, rejects duplicate batches and recipients, and describes two shielded outputs. The browser provides an employer workspace, amount masking, local circuit execution, a public receipt view, history and receipt export.

The current UI is a sandbox for inspecting contract behavior. It uses the compiler-generated JavaScript contract, not a separate approximation of the business rules. Synthetic coin data can satisfy local execution; only the network ledger can establish actual funding and final settlement.

## Privacy Model

- **PUBLIC:** employer commitment, configured token color, random batch IDs and batch count. On a live network, transaction timing, commitments, nullifiers and transaction shape are observable too. The fixed two-recipient design reveals the expected batch size.
- **PRIVATE:** employer secret, funding coin data, payout amounts and recipient keys are witness inputs. Local execution retains these in browser memory. No private-state persistence, server API, analytics or private receipt export is implemented.
- **PROVED without revealing, once integrated with network proving:** the caller knows the employer secret, each payment is positive, recipients differ, the correct token exactly funds the split, and the batch ID has not been accepted before. Current local tests execute these constraints; they do not generate or verify ZK proofs.

The employer sees both payouts. Each recipient should learn their own coin and amount after proper encrypted-output delivery is implemented. A remote proving service may receive witnesses; use a trusted local prover or explicitly assess the wallet's proving model. Do not claim privacy from the employer, the proving environment, browser extensions, or a compromised device.

`disclose(...)` around standard-library shielded calls acknowledges their commitment/nullifier links and branch leakage. Raw private data is not written to this contract's ledger. Never log or serialize complete `CircuitResults`: they include private state, witness transcripts and unencrypted local output data. Only the explicit public receipt projection is exportable.

## Privacy Claim

The public application receipt contains only mode, batch ID, batch count, token color and `settled: false`. The public contract ledger has no salary, recipient-key, or employee-name fields. These assertions are tested locally; full network transcript privacy and recipient delivery still need end-to-end verification.

Masking an amount or switching to Public observer is presentation only. It does not encrypt the DOM or isolate another user on the same device. No real payroll information should be entered in this sandbox. Batch IDs must be random and unrelated to names or salary values. Network metadata and external information can still permit correlation.

## Tech Stack

- Compact toolchain **0.31.1**, Compact runtime **0.16.0**, DApp Connector API **4.0.1**.
- React, TypeScript, Vite, Vitest and Lucide SVG icons, pinned in the lockfile.
- WebAssembly runtime loaded on demand for local circuit execution.
- Node.js 22+; Windows compilation uses Ubuntu through WSL.

Version choices follow the [Midnight compatibility matrix](https://docs.midnight.network/relnotes/support-matrix). The existing newer system compiler is not changed; scripts explicitly select `+0.31.1`.

## Prerequisites

- Node.js 22 or newer and npm.
- The official Compact CLI and toolchain 0.31.1. On Windows, install these inside WSL Ubuntu. Windows' built-in `compact.exe` is unrelated to Midnight.
- A v4-compatible Midnight wallet on Preprod to exercise wallet connection. No wallet is needed for the local circuit sandbox.
- Network settlement will additionally need funded shielded coins, DUST, indexer access and a compatible proving provider. Those integrations are not complete.

## Setup & Run Locally

From this project directory:

```sh
npm ci
compact update 0.31.1 --no-set-default
npm run compile
npm test
npm run dev
```

On Windows, replace the `compact update` line with:

```powershell
wsl -d Ubuntu -- bash -lc "compact update 0.31.1 --no-set-default"
```

`npm run compile` automatically uses WSL on Windows. On Linux/macOS it invokes `compact` directly. The compiler emits `managed/payroll/contract`, `zkir`, and `keys`. Generated artifacts are ignored by Git and regenerated in CI. `npm run compile:fast` skips proving-key generation for iteration only; it is not the release check.

```sh
npm run build
npm run preview
```

See [Usage](docs/USAGE.md) for the browser flow and [Implementation plan](docs/LEVEL3.md) for the remaining work.

## Run Tests

```sh
npm run compile
npm test -- --reporter=verbose
```

The current suite has **24 passing tests**. Tests execute the generated Compact contract and cover valid splits, public state transitions, unauthorized access, replay, incorrect funding, token mismatch, invalid amounts, duplicate recipients and private receipt exclusion. Input tests check exact integer arithmetic and bounds. Local circuit success does not prove a coin exists or a transaction can settle.

Full check:

```sh
npm run check
```

## CI/CD

[.github/workflows/ci.yml](.github/workflows/ci.yml) runs on every push, pull request and manual dispatch. It installs Node 22 and locked dependencies, installs the pinned Compact toolchain, generates proving keys, runs tests, typechecks, builds the frontend and uploads the build artifact.

There is no passing GitHub run or live status badge yet. After the owner creates a public repository and pushes this project, add the real badge below the title:

```md
[![Compile and test](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)
```

Replace OWNER/REPO with the actual repository. Do not use a fabricated green badge. Hosting is separate from this compile-and-test workflow; deploying `dist/` currently publishes only the sandbox.

## Product Proposal

See [PROPOSAL.md](PROPOSAL.md), drafted for **Private Payroll / Splits** using the PDF's four proposal headings. Owner review, submission and external approval are pending. See [Level 3 checklist](docs/LEVEL3.md) and the [one-minute demo script](docs/DEMO.md).

## Screenshots and Verification

- [Desktop workspace](docs/evidence/desktop.png)
- [Mobile workspace](docs/evidence/mobile.png)
- [Public observer](docs/evidence/observer.png)
- [Test output screenshot](docs/evidence/test-output.png), rendered from the [actual captured test log](docs/evidence/tests.txt)
- [Verification report and remaining limitations](docs/VERIFICATION.md)

## Source References

- User-provided Midnight Builder Challenge PDF, Level 3 section on PDF pages 8-11. Its generic counter example was adapted to the user's payroll idea.
- [Compact standard library](https://docs.midnight.network/compact/standard-library/exports): shielded operations and output-delivery caveat.
- [Generated contract runtime and testing](https://docs.midnight.network/guides/compact-javascript-runtime): local execution limitations.
- [Official toolchain installation](https://docs.midnight.network/getting-started/installation).

The PDF contains prompts for other levels and other assistants. They are reference material, not authority to modify assistant configuration or claim a submission was approved. This project implements the user's selected Level 3 scope.
