import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Parse .env if it exists (try project root first, then cwd)
const projectRoot = path.resolve(__dirname, '..', '..');
const envPath = fs.existsSync(path.join(projectRoot, '.env'))
  ? path.join(projectRoot, '.env')
  : path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

// Fallbacks
if (!process.env.REFRESH_TIME) {
  process.env.REFRESH_TIME = '04:00';
}
if (!process.env.DB_PATH) {
  process.env.DB_PATH = path.join(os.homedir(), '.data', 'tracker', 'tracker.db');
}
