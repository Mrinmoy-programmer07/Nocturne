import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const cwd = fileURLToPath(new URL("../", import.meta.url));
if (process.argv.slice(2).some((arg) => arg !== "--skip-zk"))
  throw new Error("Unsupported compiler option");
const args = [
  "compile",
  "+0.31.1",
  ...process.argv.slice(2),
  "contracts/payroll.compact",
  "managed/payroll",
];
// Windows compact.exe is an unrelated OS utility. Always use WSL here.
const result =
  process.platform === "win32"
    ? spawnSync(
        "wsl.exe",
        ["-d", "Ubuntu", "--", "bash", "-lc", `compact ${args.join(" ")}`],
        { cwd, stdio: "inherit" },
      )
    : spawnSync("compact", args, { cwd, stdio: "inherit" });
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
