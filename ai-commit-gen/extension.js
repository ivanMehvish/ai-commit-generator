import * as vscode from 'vscode';
import { execSync } from 'child_process';
import { generateCommitMessage } from './src/aiClient.js';

export function activate(context) {
  console.log('AI Commit Message Generator activated');

  let disposable = vscode.commands.registerCommand(
    'aiCommitGen.generateMessage',
    async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('Open a folder with a git repository first.');
        return;
      }

      const repoPath = workspaceFolders[0].uri.fsPath;
      const diff = execSync('git diff --cached', { cwd: repoPath }).toString();
      if (!diff) {
        vscode.window.showInformationMessage('No staged changes found.');
        return;
      }

      const panel = vscode.window.createWebviewPanel(
        'aiCommitGen',
        'AI Commit Messages',
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      panel.webview.html = `<h3>Generating commit messages...</h3>`;

      try {
        const messages = await generateCommitMessage(diff);

        panel.webview.html = `
          <html>
          <body>
            <h2>Select a commit message</h2>
            <ul>
              ${messages
                .map(
                  (msg, idx) => `
                <li>
                  <code>${msg}</code>
                  <button onclick="copyMessage(${idx})">Copy</button>
                </li>
              `
                )
                .join('')}
            </ul>
            <script>
              const vscode = acquireVsCodeApi();
              function copyMessage(idx) {
                vscode.postMessage({ type: 'copy', index: idx });
              }
            </script>
          </body>
          </html>
        `;

        panel.webview.onDidReceiveMessage(async (message) => {
          if (message.type === 'copy') {
            await vscode.env.clipboard.writeText(messages[message.index]);
            vscode.window.showInformationMessage('Commit message copied!');
          }
        });

      } catch (err) {
        panel.webview.html = `<h3>Error generating commit messages</h3><p>${err.message}</p>`;
        vscode.window.showErrorMessage(`Error: ${err.message}`);
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
