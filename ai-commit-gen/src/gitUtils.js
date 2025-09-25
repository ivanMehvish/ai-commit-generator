const { exec } = require('child_process');
const util = require('util');
const execP = util.promisify(exec);

/**
 * Return the staged diff (string) for the git repo at cwd.
 * Returns null if no staged changes or error.
 */
async function getGitDiff(cwd) {
  try {
    // --staged is alias of --cached; unified context small to keep payload reasonable
    const { stdout } = await execP('git diff --staged --unified=3', { cwd });
    if (!stdout || stdout.trim() === '') return null;
    return stdout;
  } catch (err) {
    return null;
  }
}

module.exports = { getGitDiff };
