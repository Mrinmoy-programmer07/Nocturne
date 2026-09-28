# Using Nocturne locally

1. Compile, build and start the app with the README commands.
2. Open Payroll. The two sample recipients and amounts are synthetic.
3. Use **Reveal amounts** to inspect or change the two payouts. Only positive whole token units are accepted. Each amount must fit in Uint<64>.
4. Use **Run local payroll circuit**. The first run loads the Midnight WebAssembly runtime. The generated Compact circuit checks the split and creates a local receipt.
5. Read the status: no proof was generated and no funds moved. Batch history is local to the tab.
6. Open **Public observer** to inspect the batch ID and local result without displaying amounts. This view is not a separate security boundary.
7. **Export public receipts** downloads only the allowlisted public projection. **Clear session** clears local history/private runtime state and restores sample inputs. Refreshing also resets the session.

Wallet connection is optional for the sandbox. For Preprod, install a DApp Connector v4 wallet, select Preprod, connect, then open **Preprod payments**. Unlock encrypted browser storage with a strong password, create or enter a test shielded asset, deploy payroll, enter two complete shielded recipient addresses, and submit the split. Export an encrypted key backup after deployment. A receipt is marked settled only after the indexer reports full success.

Preprod needs a funded wallet with DUST. The demo-token path creates 1,000,000 test units with no monetary value. Use synthetic recipient wallets and verify both wallets discover the encrypted output before claiming end-to-end completion.

No private values are written to localStorage or a backend. Network employer state is encrypted in IndexedDB; exported backups remain encrypted. Public receipts never contain salaries or recipient keys. Do not enter seed phrases or real payroll data.
