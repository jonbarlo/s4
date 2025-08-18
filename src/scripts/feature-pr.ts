#!/usr/bin/env ts-node-esm
/**
 * feature-pr.ts
 * Usage: ts-node scripts/feature-pr.ts <feature-branch-name> "PR Title" "PR Description"
 *
 * Requires: GitHub CLI (gh) installed and authenticated.
 */
import 'dotenv/config';
import { execSync } from 'child_process';

const [,, branch, title, desc] = process.argv;
if (!branch || !title) {
  console.error('Usage: ts-node scripts/feature-pr.ts <feature-branch-name> "PR Title" "PR Description"');
  process.exit(1);
}

try {
  execSync(`git checkout -b ${branch}`, { stdio: 'inherit' });
  execSync(`git push -u origin ${branch}`, { stdio: 'inherit' });
  execSync(`gh pr create --fill --title "${title}"${desc ? ` --body "${desc}"` : ''}`, { stdio: 'inherit' });
  console.log('Feature branch created and PR opened!');
} catch (err: any) {
  console.error('Error creating branch or PR:', err.message);
  process.exit(1);
}
