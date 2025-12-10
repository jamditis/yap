import { WebSocketServer } from 'ws';
import clipboardy from 'clipboardy';
import { spawn } from 'child_process';

const wss = new WebSocketServer({ port: 3001 });

console.log("Yap Background Server running on ws://localhost:3001");
console.log("Ready to type into your active terminal...");

wss.on('connection', (ws) => {
  console.log('Frontend connected.');

  ws.on('message', async (message) => {
    try {
      const text = message.toString();
      console.log(`Received: "${text}"`);

      // 1. Write to Clipboard
      await clipboardy.write(text);

      // 2. Simulate Paste (Ctrl+V) and Enter using PowerShell
      // We use a temporary PowerShell script execution to ensure it hits the active window
      const psCommand = `
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.SendKeys]::SendWait('^v')
        Start-Sleep -Milliseconds 50
        [System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
      `;

      const child = spawn('powershell', ['-Command', psCommand]);
      
      child.on('error', (err) => console.error('PowerShell Error:', err));
      child.stderr.on('data', (data) => console.error('PS Stderr:', data.toString()));
      
    } catch (e) {
      console.error("Error processing command:", e);
    }
  });
});
