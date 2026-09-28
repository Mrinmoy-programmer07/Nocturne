import { mkdir, copyFile } from "node:fs/promises";

// Only public proving artifacts belong in the website. Never copy private state.
for (const [name, circuit] of [["payroll", "pay"], ["demo-token", "mint"]]) {
  for (const [folder, extension] of [["keys", "prover"], ["keys", "verifier"], ["zkir", "bzkir"]]) {
    const destination = `public/contracts/${name}/${folder}`;
    await mkdir(destination, { recursive: true });
    await copyFile(`managed/${name}/${folder}/${circuit}.${extension}`, `${destination}/${circuit}.${extension}`);
  }
}
