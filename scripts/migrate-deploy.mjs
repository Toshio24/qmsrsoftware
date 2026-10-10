#!/usr/bin/env node
// Wraps `prisma migrate deploy` with a few retries. Neon's free-tier compute
// scales to zero when idle and has to "wake up" on the first connection of a
// deploy; occasionally that cold start loses the race against Prisma's first
// connection attempt and fails with P1001 ("Can't reach database server")
// even though the database is perfectly healthy a few seconds later. A plain
// retry is the standard fix for this — no code or schema issue to chase.
import { spawnSync } from "node:child_process";

const MAX_ATTEMPTS = 4;
const BACKOFF_MS = [3000, 6000, 10000];

/** Blocking sleep with no dependencies (Atomics.wait on a throwaway buffer —
 * no busy-spin, no async plumbing needed in this tiny standalone script). */
function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  console.log(`[migrate-deploy] attempt ${attempt}/${MAX_ATTEMPTS}: prisma migrate deploy`);
  const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status === 0) {
    process.exit(0);
  }

  if (attempt < MAX_ATTEMPTS) {
    const wait = BACKOFF_MS[attempt - 1] ?? BACKOFF_MS[BACKOFF_MS.length - 1];
    console.warn(`[migrate-deploy] failed (exit ${result.status}) — retrying in ${wait / 1000}s…`);
    sleepSync(wait);
  } else {
    console.error(`[migrate-deploy] still failing after ${MAX_ATTEMPTS} attempts, giving up.`);
    process.exit(result.status ?? 1);
  }
}
