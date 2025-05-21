# Eurovision Song Contest Charts

App for exploring voting and performance statistics from Eurovision Song Contests throughout the years.

## Getting Started

1. Clone the repository
2. Install dependencies
   ```bash
   npm install
   ```
3. Set up your Supabase environment variables
   
   Create a `.env.local` file in the root of the project with the following:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_SUPABASE_PROJECT_ID=your-project-id
   ```
   
   Replace the values with your actual Supabase project URL, anon key, and project ID.

4. Start the development server
   ```bash
   npm run dev
   ```

## Development

The app uses:
- Next.js 15
- Radix UI for components
- Supabase for database and authentication
- TypeScript for type safety

## Database Structure

The database is structured with the following tables:
- `contests` - Information about each Eurovision Song Contest
  - `id` - Unique identifier
  - `year` - Year of the contest
  - `city` - Host city
  - `country` - Host country

## Generating TypeScript Types from Supabase

The project includes a tool to automatically generate TypeScript types from your Supabase database schema:

1. Make sure your environment variables are set up in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_PROJECT_ID=your-project-id
   ```
   You can get your project ID from the URL in the Supabase dashboard: `https://app.supabase.com/project/[your-project-id]`

2. Generate an access token:
   - Go to https://app.supabase.com/account/tokens
   - Generate a new token with an appropriate name
   - Copy the token value

3. Run the script to generate types:
   ```bash
   SUPABASE_ACCESS_TOKEN=your-access-token npm run update-types
   ```
   Replace `your-access-token` with the token you generated.

This will generate TypeScript types based on your current database schema and update the `src/types/supabase.ts` file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
