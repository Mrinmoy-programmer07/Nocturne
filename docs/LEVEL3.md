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

## Still required before claiming a pass

- [ ] Real funding and proof/transaction integration.
- [ ] Recipient output encryption/discovery, confirmed by two recipient wallets.
- [ ] Deploy the contract to Preprod and record the verified address.
- [ ] Verify wallet connect, fund, prove, submit, confirm and recipient spend end to end.
- [ ] Create a public GitHub repository and push the project.
- [ ] Record passing GitHub Actions runs and add the real CI badge.
- [ ] Publish a live demo connected to the deployed contract.
- [x] Capture local test output evidence: [screenshot](evidence/test-output.png) and [log](evidence/tests.txt).
- [ ] Record the one-minute end-to-end network demo after integration.
- [ ] Owner reviews and submits PROPOSAL.md; organizer approves it.
- [ ] Accumulate at least 10 meaningful commits.

No remote repository, deployment, approval or commit history is fabricated. The empty starting workspace supplied no Level 2 repository, deployed address, funded wallet or submission destination.

## Implementation sequence

1. Review the bounded two-recipient proposal and privacy threat model.
2. Provision one supported shielded asset and a funded employer wallet on Preprod.
3. Implement providers around the compiled contract and deploy it with a securely generated employer secret. Store that secret encrypted; never put it in frontend environment variables.
4. Construct the transaction that funds the incoming contract coin. The local witness alone is not funding.
5. Add encrypted output delivery for both recipient wallets. Standard-library send calls do not by themselves prove recipient discovery works.
6. Add proof generation and submit through the selected wallet; derive displayed success only from confirmed chain execution.
7. Test duplicate/racing transactions, failures, reload/recovery and wrong-network states with real providers.
8. Publish the repository and verify the workflow, then deploy the frontend with its verified contract address.
9. Record evidence, submit the proposal and track external approval.

## Meaningful commit milestones

These are suggested logical milestones, not completed commits. Review the files before committing and use your own configured Git identity.

1. `chore: initialize pinned payroll toolchain and project structure`
2. `feat: enforce authorized atomic shielded payroll splits`
3. `test: cover payroll constraints and public data boundaries`
4. `feat: add payroll workspace and private amount controls`
5. `feat: execute compiled payroll circuits in the local browser sandbox`
6. `feat: add public receipt inspection and safe export`
7. `feat: connect Midnight wallets and validate Preprod selection`
8. `ci: compile Compact and verify tests and build on push`
9. `docs: define payroll proposal and explicit privacy model`
10. `feat: integrate and verify Preprod funding and settlement` (future work)

Do not split empty changes into commits just to inflate the count. Preserve the ten-commit requirement as real development history.
