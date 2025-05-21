# Generating Supabase Types

## Using the Project's Built-in Script

The recommended approach is using the project's built-in script which reads configuration from environment variables:

1. Make sure your environment variables are set up in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_PROJECT_ID=your-project-id
   ```

2. Run the script with your access token:
   ```bash
   SUPABASE_ACCESS_TOKEN=your-access-token npm run update-types
   ```

This will generate TypeScript types based on your current database schema and save them to `src/types/supabase.ts`.

## How It Works

The script:
1. Reads your project ID from `.env.local`
2. Uses the Supabase CLI to generate types
3. Handles errors and ensures the output directory exists

## Alternative: Using the CLI Directly

If you prefer to use the Supabase CLI directly:

```bash
npx supabase gen types typescript \
  --project-id your-project-id \
  --schema public \
  > src/types/supabase.ts
```

Replace `your-project-id` with your actual Supabase project ID.

## Alternative: Using the Supabase Dashboard

You can also generate types directly from the Supabase dashboard:

1. Go to your Supabase project
2. Navigate to the "API" section in the sidebar
3. Select the "TypeScript" tab
4. Copy the generated types
5. Paste them into `src/types/supabase.ts` 