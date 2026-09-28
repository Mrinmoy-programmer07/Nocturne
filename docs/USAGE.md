# Using Nocturne locally

1. Compile, build and start the app with the README commands.
2. Open Payroll. The two sample recipients and amounts are synthetic.
3. Use **Reveal amounts** to inspect or change the two payouts. Only positive whole token units are accepted. Each amount must fit in Uint<64>.
4. Use **Run local payroll circuit**. The first run loads the Midnight WebAssembly runtime. The generated Compact circuit checks the split and creates a local receipt.
5. Read the status: no proof was generated and no funds moved. Batch history is local to the tab.
6. Open **Public observer** to inspect the batch ID and local result without displaying amounts. This view is not a separate security boundary.
7. **Export public receipts** downloads only the allowlisted public projection. **Clear session** clears local history/private runtime state and restores sample inputs. Refreshing also resets the session.

Wallet connection is optional and independent of circuit execution. Install a compatible Midnight wallet, unlock it, set Preprod, then click **Connect wallet**. The app checks the returned network and shows a shortened shielded address. **Disconnect** clears the app's handle; revoke remembered site permission in the wallet settings if desired. Wallet signing and payment submission are not implemented yet.

No private values are written to localStorage, a backend, or downloaded receipts. They are still accessible in the browser's memory to the person controlling that browser. Do not enter actual payroll data, seed phrases or real employer secrets.
