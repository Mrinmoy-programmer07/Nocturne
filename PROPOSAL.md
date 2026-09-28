# Product Proposal

Selected idea: **Private Payroll / Splits: distribute funds without exposing amounts.**

Product name: **Nocturne**

Status: Draft for the project owner to review and submit. Not submitted or approved.

## What is the product, and who uses it?

Nocturne lets a small team split a payment between two contributors without publishing their individual compensation. The employer prepares the two payouts, authorizes a batch, and receives a public batch record after successful settlement. Each recipient receives a shielded payment.

The initial users are small DAOs, grant teams, and groups paying two contractors. The first release supports exactly two distinct recipients, one configured shielded asset, and exact funding. Both payments must succeed in the same transaction. It excludes recurring schedules, fiat conversion, tax calculations, large payroll imports, and multi-signature administration.

## Why Midnight specifically?

A transparent token transfer publishes amounts and recipient addresses. Encrypting a spreadsheet does not fix that public payment trail. Midnight's Compact circuits can constrain employer authorization, funding conservation, and duplicate-batch prevention while using shielded coin commitments instead of cleartext amounts in the public contract ledger.

Nocturne uses `receiveShielded` and two `sendImmediateShielded` calls. A random batch ID and a counter are intentionally public. Individual salaries and the employer secret are private witness inputs. The employer knows all payouts, so this is privacy from public observers and other recipients, not from the employer. A proof service that receives private proving inputs is also inside the trust boundary.

## Data Model

| Data Point | Type | Disclosed To |
| --- | --- | --- |
| Employer authorization commitment | Public ledger, Bytes<32> | Everyone |
| Accepted shielded token color | Public ledger, Bytes<32> | Everyone |
| Random batch identifiers | Public ledger, Set<Bytes<32>> | Everyone |
| Number of executed batches | Public ledger, Counter | Everyone |
| Employer secret | Private witness, 32 random bytes | Employer and trusted proving environment |
| Funding coin nonce, color, value | Private witness, ShieldedCoinInfo | Employer and trusted proving environment |
| Two recipient coin keys | Private witness, Vector<2, ZswapCoinPublicKey> | Employer and trusted proving environment |
| Two payout amounts | Private witness, Vector<2, Uint<64>> | Employer and trusted proving environment; each recipient learns their own payout |
| Shielded commitments, nullifiers, timing and transaction shape | Protocol metadata | Network observers |
| Employee names and HR records | Out of scope | Not collected |

`disclose` at the shielded standard-library boundary acknowledges commitment links and change-branch leakage. It is not an instruction to put a raw salary on the public ledger. All public writes and generated public transcripts still require review.

## Mainnet Feasibility

The bounded two-recipient MVP is technically realistic as a development target, but mainnet readiness is not established. The current foundation compiles with Compact 0.31.1 and executes the generated contract locally. The frontend runs synthetic coins, not live money.

Before a Preprod release, implement real funding, wallet provider wiring, recipient ciphertext delivery, proof generation, transaction submission, confirmation and rejection handling. Verify both recipients can discover and spend their outputs. A contract-generated output alone does not establish wallet receipt.

Before any mainnet use, obtain a security review, test the complete payment flow on the target network, choose a suitable shielded asset, add secure secret backup and recovery, assess prover privacy, and plan how growing batch state will be managed. Keep local circuit tests distinct from proof verification and chain settlement.

Acceptance criteria for the MVP: an authorized, funded employer can settle exactly two positive shielded payments; an unauthorized sender, duplicate batch, wrong asset, duplicate recipient, or mismatched total is rejected; no salary or recipient key appears in application public receipts or the contract's public ledger; each recipient can discover and spend their own payment.
