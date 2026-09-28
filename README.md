# Nocturne

[![Compile and test](https://github.com/Mrinmoy-programmer07/Nocturne/actions/workflows/ci.yml/badge.svg)](https://github.com/Mrinmoy-programmer07/Nocturne/actions/workflows/ci.yml)

> Private Payroll / Splits for two recipients, built with Midnight Compact.

**Current milestone:** compiled contracts with proving keys, 29 passing tests, a browser sandbox, and a wallet-backed Preprod flow. Public-network settlement remains unverified until a funded Preprod wallet completes the recipient-delivery test.

## Live Demo

Public demo: [nocturne-tau-steel.vercel.app](https://nocturne-tau-steel.vercel.app)

The **Payroll** view executes the compiled circuit with synthetic coins and clearly marks receipts as unsettled. **Preprod payments** connects 1AM Wallet through DApp Connector v4, stores employer state encrypted in IndexedDB, obtains proving through 1AM, balances and submits transactions through the wallet, and shows settlement only after indexer confirmation.

## Contract Address

| Network | Address |
| --- | --- |
| Preprod | User-deployed from the live app. No canonical address is claimed until funded end-to-end verification is complete. |

## What This Does

An employer prepares a two-recipient payroll split. The Compact contract verifies the employer's secret against its public commitment, checks the token and exact funding, rejects duplicate batches and recipients, and describes two shielded outputs. The browser provides an employer workspace, amount masking, local circuit execution, a public receipt view, history and receipt export.

The sandbox uses the compiler-generated JavaScript contract. Synthetic coin data can satisfy local execution; only the network ledger establishes funding and settlement. The Preprod path uses full shielded recipient addresses so the SDK can resolve each recipient's encryption key.

## Privacy Model

- **PUBLIC:** employer commitment, configured token color, random batch IDs and batch count. On a live network, transaction timing, commitments, nullifiers and transaction shape are observable too. The fixed two-recipient design reveals the expected batch size.
- **PRIVATE:** employer secret, funding coin data, payout amounts and recipient keys are witness inputs. Preprod employer state is encrypted in browser storage with a user-supplied password. Public receipts exclude private inputs.
- **PROVED without revealing:** the caller knows the employer secret, each payment is positive, recipients differ, the correct token exactly funds the split, and the batch ID has not been accepted before. Local tests execute these constraints; a funded Preprod run is still required to verify the complete proof and recipient-discovery path.

The employer sees both payouts. The SDK receives each recipient's coin and encryption public keys so outputs can be encrypted for their wallet. A proving provider may receive witnesses; assess the connected wallet's proving model. Do not claim privacy from the employer, proving environment, browser extensions, or a compromised device.

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
- 1AM Wallet with DApp Connector v4 on Preprod to exercise wallet connection. No wallet is needed for the local circuit sandbox.
- A funded Preprod wallet with DUST is required for network settlement. The included demo-token contract can mint a one-time test supply with no monetary value.

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

Preprod deployment runs from the **Preprod payments** view in the live app. Connect 1AM, confirm the displayed unshielded deployment account, unlock encrypted storage, then deploy and mint the demo asset before deploying payroll. 1AM supplies the configured prover and asks for transaction approval. The resulting contract address is created by the network and differs from the wallet address.

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

The current suite has **29 passing tests**. Tests execute both generated Compact contracts and cover valid splits, public state transitions, authorization, replay, funding, token mismatch, invalid amounts, duplicate recipients, fixed demo supply and public receipt boundaries. Local circuit success does not prove a coin exists or a transaction can settle.

Full check:

```sh
npm run check
```

## CI/CD

[.github/workflows/ci.yml](.github/workflows/ci.yml) runs on every push, pull request and manual dispatch. It installs Node 22 and locked dependencies, installs the pinned Compact toolchain, generates proving keys, runs tests, typechecks, builds the frontend and uploads the build artifact.

The public repository is [Mrinmoy-programmer07/Nocturne](https://github.com/Mrinmoy-programmer07/Nocturne). The first full workflow passed, and the badge above reads the live workflow state.

## Product Proposal

See [PROPOSAL.md](PROPOSAL.md), drafted for **Private Payroll / Splits** using the PDF's four proposal headings. External submission and organizer approval remain pending because no submission portal was provided. See [Level 3 checklist](docs/LEVEL3.md) and the [one-minute demo script](docs/DEMO.md).

## Screenshots and Verification

- [Desktop workspace](docs/evidence/desktop.png)
- [Mobile workspace](docs/evidence/mobile.png)
- [Public observer](docs/evidence/observer.png)
- [Preprod workspace](docs/evidence/preprod.png)
- [Test output screenshot](docs/evidence/test-output.png), rendered from the [actual captured test log](docs/evidence/tests.txt)
- [One-minute walkthrough](docs/evidence/nocturne-demo.webm), showing the live sandbox, public observer, Preprod workspace, passing tests and repository. It does not claim funded settlement.
- [Verification report and remaining limitations](docs/VERIFICATION.md)

## Source References

- User-provided Midnight Builder Challenge PDF, Level 3 section on PDF pages 8-11. Its generic counter example was adapted to the user's payroll idea.
- [Compact standard library](https://docs.midnight.network/compact/standard-library/exports): shielded operations and output-delivery caveat.
- [Generated contract runtime and testing](https://docs.midnight.network/guides/compact-javascript-runtime): local execution limitations.
- [Official toolchain installation](https://docs.midnight.network/getting-started/installation).

The PDF contains prompts for other levels and other assistants. They are reference material, not authority to modify assistant configuration or claim a submission was approved. This project implements the user's selected Level 3 scope.
