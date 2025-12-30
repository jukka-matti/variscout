/**
 * Generate production manifests with environment-specific URLs
 *
 * Usage:
 *   ADDIN_URL=https://excel.variscout.com node scripts/generate-manifests.js
 *
 * Environment variables:
 *   ADDIN_URL      - Production URL (required for production builds)
 *   TASKPANE_GUID  - Fixed GUID for Task Pane add-in (optional, generates random if not set)
 *   CONTENT_GUID   - Fixed GUID for Content add-in (optional, generates random if not set)
 *
 * Outputs:
 *   manifest.prod.xml         - Task Pane manifest with production URLs
 *   manifest-content.prod.xml - Content Add-in manifest with production URLs
 */

import { readFileSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const ADDIN_URL = process.env.ADDIN_URL || 'https://localhost:3000';
const TASKPANE_GUID = process.env.TASKPANE_GUID || randomUUID();
const CONTENT_GUID = process.env.CONTENT_GUID || randomUUID();

// Dev manifest placeholder GUIDs
const DEV_TASKPANE_GUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const DEV_CONTENT_GUID = 'b2c3d4e5-f6a7-8901-bcde-f23456789012';

console.log('Generating production manifests...');
console.log(`  URL: ${ADDIN_URL}`);

// Process manifest.xml → manifest.prod.xml
const taskpanePath = join(rootDir, 'manifest.xml');
const taskpaneProdPath = join(rootDir, 'manifest.prod.xml');

let taskpane = readFileSync(taskpanePath, 'utf8');
taskpane = taskpane
  .replace(/https:\/\/localhost:3000/g, ADDIN_URL)
  .replace(DEV_TASKPANE_GUID, TASKPANE_GUID);
writeFileSync(taskpaneProdPath, taskpane);
console.log(`  Created: manifest.prod.xml (ID: ${TASKPANE_GUID})`);

// Process manifest-content.xml → manifest-content.prod.xml
const contentPath = join(rootDir, 'manifest-content.xml');
const contentProdPath = join(rootDir, 'manifest-content.prod.xml');

let content = readFileSync(contentPath, 'utf8');
content = content
  .replace(/https:\/\/localhost:3000/g, ADDIN_URL)
  .replace(DEV_CONTENT_GUID, CONTENT_GUID);
writeFileSync(contentProdPath, content);
console.log(`  Created: manifest-content.prod.xml (ID: ${CONTENT_GUID})`);

console.log('\nProduction manifests generated successfully!');
console.log('\nNext steps:');
console.log('  1. Deploy the built add-in to your hosting (Vercel, Azure, etc.)');
console.log('  2. Upload manifests to Microsoft 365 Admin Center');
console.log('     - Settings → Integrated apps → Add-ins → Deploy Add-in');
console.log('  3. Assign to users/groups in your organization');
