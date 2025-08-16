#!/usr/bin/env node
/**
 * feature-pr.js
 * Usage: node scripts/feature-pr.js <feature-branch-name> "PR Title" "PR Description"
 *
 * Requires: GitHub CLI (gh) installed and authenticated.
 */
const { execSync } = require('child_process');

const [,, branch, title, desc] = process.argv;
if (!branch || !title) {
  console.error('Usage: node scripts/feature-pr.js <feature-branch-name> "PR Title" "PR Description"');
  process.exit(1);
}

try {
  execSync(`git checkout -b ${branch}`, { stdio: 'inherit' });
  execSync(`git push -u origin ${branch}`, { stdio: 'inherit' });
  execSync(`gh pr create --fill --title "${title}"${desc ? ` --body "${desc}"` : ''}`, { stdio: 'inherit' });
  console.log('Feature branch created and PR opened!');
} catch (err) {
  console.error('Error creating branch or PR:', err.message);
  process.exit(1);
}
