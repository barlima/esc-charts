# Eurovision Song Contest Database Population Script

This script reads data from the `data/eurovision_song_contest_1975_2019.xlsx` Excel file and populates the Supabase database tables with Eurovision Song Contest voting data.

## Tables Populated

1. **countries** - All countries that participated in Eurovision
2. **contests** - Contest events by year
3. **venues** - Contest venues (finals, semifinals)
4. **songs** - Song entries (with placeholder data)
5. **votes** - Voting data between countries

## Prerequisites

- Node.js 14+ installed
- TypeScript installed
- ts-node installed (`npm install -g ts-node` or as dev dependency)
- Access to the esc-charts Supabase project

## Usage

The script is configured in package.json with the following commands:

```bash
# Populate the database without cleaning existing data
npm run populate-db

# Clean existing data before populating the database
npm run populate-db:cleanup
```

## Data Mapping

The script maps data from the Excel file columns to database tables:

- Year → contests.year
- Country names → countries.name
- Voting data → votes table (from_country, to_country, points)
- Contest stages → venues.type (final, semifinal1, semifinal2)

## Notes

- Some data like song titles and artists are created as placeholders since they're not in the source Excel file
- Host countries and cities are hard-coded for recent years (2015-2019) for demonstration
- The script handles potential duplicate entries and foreign key relationships 

# Scripts

This directory contains various utility scripts for the Eurovision charts application.

## Available Scripts

### `generate-types.ts`
Generates TypeScript types from the Supabase database schema.

**Usage:**
```bash
npm run update-types
```

### `populateDb.ts`
Populates the database with Eurovision contest data from Excel files.

**Usage:**
```bash
# Populate database
npm run populate-db

# Cleanup and repopulate
npm run populate-db:cleanup
```

### `import-votes.ts`
Imports Eurovision voting results from CSV files to the database.

**Usage:**
```bash
npm run import-votes -- --year=YEAR --venue=VENUE
```

**Parameters:**
- `--year=YEAR`: The contest year (e.g., 2025)
- `--venue=VENUE`: The venue type, one of:
  - `final` - Grand Final
  - `sm1` - Semi-final 1  
  - `sm2` - Semi-final 2

**File Naming Convention:**
The script expects CSV files to be located in the `data/` directory with the following naming pattern:
- `[YEAR]_[VENUE]_jury.csv` - Jury votes
- `[YEAR]_[VENUE]_public.csv` - Televote/public votes

**Examples:**
```bash
# Import 2025 Grand Final votes
npm run import-votes -- --year=2025 --venue=final

# Import 2025 Semi-final 1 votes  
npm run import-votes -- --year=2025 --venue=sm1

# Import 2025 Semi-final 2 votes
npm run import-votes -- --year=2025 --venue=sm2
```

**CSV Format:**
The CSV files should have semicolon (`;`) as the separator with the following structure:
- First column: `to_country` - Country receiving votes
- Second column: `total` - Total points received (ignored by script)
- Remaining columns: Country names as headers, containing the points given (1-12)

**Features:**
- Automatically creates contest and venue records if they don't exist
- Cleans existing votes for the same contest/venue before importing
- Handles country name variations (e.g., "Netherlands" vs "The Netherlands", "Luxemburg" vs "Luxembourg")
- Imports both jury and televote data
- Batch processing for efficient database operations
- Comprehensive error handling and logging

**Important Note:**
After importing votes, you need to link them to songs for the application to display points correctly. The script will output an SQL query that you need to run manually in the Supabase SQL editor. This links votes to their corresponding songs based on the receiving country and venue type.

**Eurovision Voting Rules:**
- **Final votes**: Link only to songs competing in the final
- **Semifinal votes**: Can link to any song in the contest, because some countries (like "Big Five" countries) vote in semifinals but their songs compete in the final

**Troubleshooting:**
If the application shows 0 points for all countries after importing votes, it means the votes are not linked to songs. Run the SQL query provided by the import script in Supabase to fix this.

## Configuration

All scripts use the same Supabase configuration:
- Database URL: Set via `SUPABASE_URL` environment variable or defaults to project URL
- API Key: Set via `SUPABASE_KEY` environment variable or defaults to anon key

Environment variables can be set in a `.env` file in the project root. 