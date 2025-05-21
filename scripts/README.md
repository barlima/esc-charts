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