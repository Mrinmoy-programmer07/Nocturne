# Level 3 delivery tracker

## Completed foundation

- [x] Payroll product selected from the provided idea list.
- [x] Compact payroll contract implemented and compiled, including proving keys.
- [x] More than 3 passing tests, including generated contract execution and privacy projections.
- [x] Browser UI with local circuit execution, masked amounts, receipt export and observer view.
- [x] Responsive layout and input/loading/error states.
- [x] Wallet connector v4 integration, with network checking and local disconnect.
- [x] Compile + tests + frontend build workflow on every push and PR.
- [x] README privacy model and product proposal draft.
- [x] Public GitHub repository with 10 meaningful commits.
- [x] Passing GitHub Actions workflow and live badge.
- [x] Wallet-backed Preprod deploy, prove, submit and confirmation code path.
- [x] Recipient encryption-key mapping from full shielded addresses.

## Still required before claiming a pass

- [ ] Complete a funded Preprod proof and transaction with recorded transaction evidence.
- [ ] Confirm encrypted output discovery and spend with two recipient wallets.
- [ ] Deploy the contract to Preprod and record the verified address.
- [ ] Verify wallet connect, fund, prove, submit, confirm and recipient spend end to end.
- [x] Create a public GitHub repository and push the project.
- [x] Record passing GitHub Actions runs and add the real CI badge.
- [ ] Publish and browser-check the live demo.
- [x] Capture local test output evidence: [screenshot](evidence/test-output.png) and [log](evidence/tests.txt).
- [ ] Record the one-minute end-to-end network demo after integration.
- [ ] Owner reviews and submits PROPOSAL.md; organizer approves it.
- [x] Accumulate at least 10 meaningful commits.

No network transaction, external approval or demo video is fabricated. The project has no funded wallet or submission destination in the provided workspace.

## Implementation sequence

1. Fund a synthetic employer wallet with Preprod NIGHT and allow DUST to accrue.
2. Use the live app to deploy the fixed-supply demo asset, mint it, then deploy payroll.
3. Submit a split to two test recipient wallets and record the confirmed transaction.
4. Confirm each wallet discovers and can spend its own encrypted output.
5. Record the one-minute video, submit the proposal through the organizer's portal, and track approval.

## Meaningful commit milestones

The repository contains these ten completed development commits:

1. `chore: initialize pinned payroll toolchain and project structure`
2. `feat: enforce authorized atomic shielded payroll splits`
3. `test: cover payroll constraints and public data boundaries`
4. `feat: add payroll workspace and private amount controls`
5. `feat: execute compiled payroll circuits in the local browser sandbox`
6. `feat: add public receipt inspection and safe export`
7. `feat: connect Midnight wallets and validate Preprod selection`
8. `ci: compile Compact and verify tests and build on push`
9. `docs: define payroll proposal and explicit privacy model`
10. `feat: add encrypted Preprod payroll workspace`

Do not split empty changes into commits just to inflate the count. Preserve the ten-commit requirement as real development history.
