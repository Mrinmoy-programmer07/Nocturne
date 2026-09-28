# Local verification

The tested flow is employer input, compiled Compact circuit execution, public receipt, then observer view. No server or blockchain submission is involved in this milestone.

| Boundary | Result | Evidence |
| --- | --- | --- |
| Compact compile | Passed | Generated contract, ZKIR, `pay.prover` and `pay.verifier` in managed/payroll |
| Contract/application tests | 24 passed | [Captured output](evidence/tests.txt) |
| TypeScript and production build | Passed | `npm run build` |
| Desktop UI | Passed | [Screenshot](evidence/desktop.png) |
| Mobile UI | Passed at 390 x 844 | [Full-page screenshot](evidence/mobile.png); document width does not exceed viewport |
| Browser circuit execution | Passed | Real generated circuit reports local success; repeated runs update batch count |
| Public observer | Passed | No salary input elements or recipient keys rendered in observer view |
| Invalid amount | Passed | Zero amount produces a positive-integer validation error |
| Wallet absent | Passed | Clear wallet-install/unlock guidance; no false connected state |
| Console and page exceptions | None observed after runtime fix | Browser console/error checks |
| Receipt export data | Unit-tested allowlist | Only mode, batch ID, batch count, token and false settlement flag |
| Actual file download | Automation limitation | Browser automation canceled downloads; requires a manual browser check |
| Wallet on Preprod | Not verified | A compatible connected wallet was not available in the test browser |
| Proof generation and network payment | Not implemented | Explicitly pending; no synthetic transaction IDs or confirmations |

The compiler-generated sourcemap references its standard-library source, which is not copied into this repository. Vitest warns about that source file; contract execution tests still pass. This is not a proof-generation or settlement error.

The initial browser test caught Compact runtime 0.16.0 using Node's `Buffer` during shielded commitment construction. The application now provides the browser Buffer implementation before circuit execution. Subsequent runs passed.

Regenerate the test log and its HTML view with `node scripts/test-evidence.mjs`. Screenshot `tmp/test-output.html` if fresh visual evidence is needed. Keep the original captured text with the image so reviewers can inspect the source of the screenshot.
