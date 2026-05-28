const { spawnSync } = require('node:child_process');

const commands = [
  ['npm', ['run', 'build:libs']],
  ['npm', ['run', 'build:apps']],
];

for (const [command, args] of commands) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
