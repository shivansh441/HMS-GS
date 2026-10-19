import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Locate tsx CLI path dynamically
let tsxPath = '';
const bunDir = join(process.cwd(), 'node_modules', '.bun');
if (existsSync(bunDir)) {
  const tsxEntry = readdirSync(bunDir).find((d) => d.startsWith('tsx@'));
  if (tsxEntry) {
    const candidate = join(bunDir, tsxEntry, 'node_modules', 'tsx', 'dist', 'cli.mjs');
    if (existsSync(candidate)) {
      tsxPath = candidate;
    }
  }
}

const testFiles = [
  'backend-2/src/utils/finance.test.ts',
  'backend-2/src/utils/agreed-rate.test.ts',
  'backend-2/src/services/validators.test.ts',
  'my-admin-portal/src/utils/payrollCalculation.test.ts',
];

const args = tsxPath
  ? [tsxPath, '--test', ...testFiles]
  : ['--test', ...testFiles];

console.log(`Running test suite with ${tsxPath ? 'tsx runner' : 'node runner'}...`);
const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
process.exit(result.status ?? 0);
