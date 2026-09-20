// scripts/package-extension.mjs
// Packages the JASAGA Netflix Sync extension for production distribution

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const extDir = path.join(rootDir, "netflix-extension-poc");
const distDir = path.join(rootDir, "dist");
const zipName = "jasaga-netflix-sync-v1.0.0.zip";
const zipPath = path.join(distDir, zipName);

console.log("Packaging JASAGA Netflix Sync Extension...");

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

try {
  // Create clean zip package excluding git, temp, and OS metadata
  execSync(`zip -r "${zipPath}" . -x "*.DS_Store" "*README.md"`, {
    cwd: extDir,
    stdio: "inherit",
  });
  console.log(`\n✔ Extension packaged successfully: ${zipPath}`);
} catch (err) {
  console.error("Packaging failed:", err.message);
  process.exit(1);
}
