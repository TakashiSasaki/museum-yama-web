import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  // Try to grab the previous version of mountain_merged.json from git
  const originalContent = execSync('git show HEAD:mountain_merged.json', { encoding: 'utf8' });
  const originalJson = JSON.parse(originalContent);
  console.log(`Original JSON mountain count: ${originalJson.length}`);
  
  // Also check if there are differences or if we should restore it
  fs.writeFileSync(path.join(__dirname, '../mountain_merged_original_backup.json'), originalContent, 'utf8');
} catch (e: any) {
  console.error("Failed to read from git:", e.message || e);
}
