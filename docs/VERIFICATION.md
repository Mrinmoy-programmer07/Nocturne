# Local verification

The verified local flow is employer input, compiled Compact circuit execution, public receipt, observer view, and the browser-rendered Preprod workspace. Blockchain settlement still needs a funded wallet and two recipients.

| Boundary | Result | Evidence |
| --- | --- | --- |
| Compact compile | Passed | Generated contract, ZKIR, `pay.prover` and `pay.verifier` in managed/payroll |
| Contract/application tests | 29 passed | [Captured output](evidence/tests.txt) |
| TypeScript and production build | Passed | `npm run build` |
| Production deployment | Passed | [Vercel live demo](https://nocturne-tau-steel.vercel.app); app and public proving artifacts return HTTP 200 |
| Desktop UI | Passed | [Screenshot](evidence/desktop.png) |
| Mobile UI | Passed at 390 x 844 | [Full-page screenshot](evidence/mobile.png); document width does not exceed viewport |
| Browser circuit execution | Passed | Real generated circuit reports local success; repeated runs update batch count |
| Public observer | Passed | No salary input elements or recipient keys rendered in observer view |
| Invalid amount | Passed | Zero amount produces a positive-integer validation error |
| Wallet absent | Passed | Clear wallet-install/unlock guidance; no false connected state |
| Console and page exceptions | None observed after runtime fix | Browser console/error checks |
| Receipt export data | Unit-tested allowlist | Only mode, batch ID, batch count, token and false settlement flag |
| Encrypted storage and public export | Code and unit boundaries passed | Private state uses encrypted IndexedDB; public receipts use an explicit allowlist |
| Wallet on Preprod | Not verified | A compatible connected wallet was not available in the test browser |
| Proof generation and network payment | Implemented, not funded | Uses the wallet proving provider, balance/submit APIs, and indexer-finalized receipts; no transaction is claimed without evidence |
| Recipient ciphertext mapping | Implemented, not recipient-verified | Full shielded addresses provide coin and encryption public keys to the Midnight SDK |

The compiler-generated sourcemap references its standard-library source, which is not copied into this repository. Vitest warns about that source file; contract execution tests still pass. This is not a proof-generation or settlement error.

The initial browser test caught Compact runtime 0.16.0 using Node's `Buffer` during shielded commitment construction. The application provides the browser Buffer implementation before circuit execution. Browser verification now passes for the sandbox and lazy-loaded Preprod workspace with no error overlay or horizontal mobile overflow.

Regenerate the test log and its HTML view with `node scripts/test-evidence.mjs`. Screenshot `tmp/test-output.html` if fresh visual evidence is needed. Keep the original captured text with the image so reviewers can inspect the source of the screenshot.
