#!/usr/bin/env node
/**
 * TALENT.APP - NPM Downloads Booster
 * Installs your packages to boost download count
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PACKAGES = [
  "@giwaov/stacks-tip-jar",
  "@giwaov/stacks-voting",
];

async function installPackages(count) {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║      TALENT.APP - NPM DOWNLOADS BOOSTER                    ║
╠════════════════════════════════════════════════════════════╣
║  Installing packages ${count} times                                ║
╚════════════════════════════════════════════════════════════╝
`);

  let success = 0;
  const baseDir = path.join(os.tmpdir(), "npm-boost-" + Date.now());
  fs.mkdirSync(baseDir, { recursive: true });

  for (let i = 0; i < count; i++) {
    const dir = path.join(baseDir, `install-${i}`);
    fs.mkdirSync(dir, { recursive: true });
    
    process.stdout.write(`  [${i + 1}/${count}] Installing... `);
    
    try {
      // Create minimal package.json
      fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({
        name: `test-${i}`,
        version: "1.0.0",
        dependencies: {}
      }));
      
      // Install packages
      execSync(
        `npm install ${PACKAGES.join(" ")} --no-fund --no-audit --prefer-online`,
        { cwd: dir, stdio: "pipe", timeout: 60000 }
      );
      
      console.log("✅");
      success++;
    } catch (e) {
      console.log("❌");
    }
    
    // Cleanup
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {}
  }

  // Cleanup base dir
  try {
    fs.rmSync(baseDir, { recursive: true, force: true });
  } catch {}

  console.log(`
══════════════════════════════════════════════════════════════
📊 RESULTS: ${success}/${count} successful installs
   Downloads added: ~${success * PACKAGES.length}
══════════════════════════════════════════════════════════════
`);
}

const count = parseInt(process.argv[2]) || 10;
installPackages(count).catch(console.error);
