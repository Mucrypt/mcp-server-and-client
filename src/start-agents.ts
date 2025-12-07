import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const agentsDir = path.join(__dirname, 'agents');

fs.readdir(agentsDir, (err, files) => {
  if (err) {
    console.error('Could not list the directory.', err);
    process.exit(1);
  }

  files.forEach((file, index) => {
    if (path.extname(file) === '.ts') {
      const agentPath = path.join(agentsDir, file);
      const process = spawn('tsx', [agentPath], { stdio: 'inherit' });

      process.on('close', (code) => {
        console.log(`Agent ${file} exited with code ${code}`);
      });
    }
  });
});
