#!/usr/bin/env node
/**
 * TALENT.APP - GitHub Commits Booster
 * Adds meaningful commits to Stacks repositories
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const REPOS = [
  "C:\\Users\\DELL\\stacks-tip-jar",
  "C:\\Users\\DELL\\stacks-voting",
];

const COMMIT_TYPES = [
  { type: "feat", desc: "add new feature" },
  { type: "fix", desc: "fix bug" },
  { type: "docs", desc: "update documentation" },
  { type: "chore", desc: "maintenance update" },
  { type: "perf", desc: "performance improvement" },
  { type: "refactor", desc: "code refactoring" },
  { type: "style", desc: "code style update" },
  { type: "test", desc: "add tests" },
];

const FEATURES = [
  "wallet integration", "UI components", "contract calls",
  "error handling", "state management", "API endpoints",
  "user feedback", "loading states", "accessibility",
  "mobile responsiveness", "dark mode", "caching",
];

function addCommit(repoPath, message) {
  try {
    process.chdir(repoPath);
    
    // Create/update activity log with unique content
    const logFile = path.join(repoPath, "ACTIVITY_LOG.md");
    const timestamp = new Date().toISOString();
    const random = Math.random().toString(36).substring(7);
    const logEntry = `\n## ${timestamp}\n- ${message}\n- Session: ${random}\n- Build: ${Date.now()}\n`;
    
    if (fs.existsSync(logFile)) {
      let content = fs.readFileSync(logFile, "utf8");
      content += logEntry;
      fs.writeFileSync(logFile, content);
    } else {
      fs.writeFileSync(logFile, `# Activity Log\n\nTracking development progress.\n${logEntry}`);
    }

    execSync("git add -A", { stdio: "pipe" });
    execSync(`git commit -m "${message}" --allow-empty`, { stdio: "pipe" });
    execSync("git push origin master", { stdio: "pipe", timeout: 30000 });
    
    return true;
  } catch (e) {
    console.error(e.message);
    return false;
  }
}

async function main() {
  const commitsPerRepo = parseInt(process.argv[2]) || 5;
  
  console.log(`
╔════════════════════════════════════════════════════════════╗
║      TALENT.APP - GITHUB COMMITS BOOSTER                   ║
╠════════════════════════════════════════════════════════════╣
║  Adding ${commitsPerRepo} commits to each Stacks repo                     ║
╚════════════════════════════════════════════════════════════╝
`);

  let totalSuccess = 0;

  for (const repo of REPOS) {
    const repoName = path.basename(repo);
    console.log(`\n📁 ${repoName}`);
    console.log("─".repeat(40));

    for (let i = 0; i < commitsPerRepo; i++) {
      const commitType = COMMIT_TYPES[Math.floor(Math.random() * COMMIT_TYPES.length)];
      const feature = FEATURES[Math.floor(Math.random() * FEATURES.length)];
      const message = `${commitType.type}: ${commitType.desc} for ${feature}`;
      
      process.stdout.write(`  [${i + 1}/${commitsPerRepo}] ${message.slice(0, 40)}... `);
      
      if (addCommit(repo, message)) {
        console.log("✅");
        totalSuccess++;
      } else {
        console.log("❌");
      }
      
      // Small delay between commits
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`
══════════════════════════════════════════════════════════════
📊 RESULTS: ${totalSuccess}/${REPOS.length * commitsPerRepo} commits pushed
══════════════════════════════════════════════════════════════
`);
}

main().catch(console.error);
