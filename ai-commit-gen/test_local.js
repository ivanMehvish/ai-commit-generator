import { execSync } from 'child_process';
import { generateCommitMessage } from './src/aiClient.js';

const repoPath = process.argv[2] || './';

const diff = execSync('git diff --cached', { cwd: repoPath }).toString();
console.log('STAGED DIFF (first 1000 chars):\n', diff.slice(0, 1000));

(async () => {
  const messages = await generateCommitMessage(diff);
  console.log('\nGenerated Commit Suggestions:');
  messages.forEach((m, i) => console.log(`${i + 1}. ${m}`));
})();
