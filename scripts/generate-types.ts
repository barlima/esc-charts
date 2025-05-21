import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('Loading environment variables from .env.local');
  dotenv.config({ path: envLocalPath });
} else {
  console.warn('.env.local file not found. Make sure you have the Supabase environment variables set.');
}

// Check for required environment variables
const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
if (!projectId) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_PROJECT_ID is not defined in .env.local');
  process.exit(1);
}

const outputPath = path.resolve(process.cwd(), 'src/types/supabase.ts');

try {
  // Make sure the types directory exists
  const typesDir = path.dirname(outputPath);
  if (!fs.existsSync(typesDir)) {
    fs.mkdirSync(typesDir, { recursive: true });
  }

  // Run the Supabase CLI command to generate types
  console.log(`Generating Supabase types for project ID: ${projectId}`);
  
  const command = `npx supabase gen types typescript --project-id ${projectId} > ${outputPath}`;
  execSync(command, { stdio: 'inherit' });
  
  console.log(`Types successfully generated at: ${outputPath}`);
} catch (error) {
  console.error('Error generating types:', error);
  process.exit(1);
} 