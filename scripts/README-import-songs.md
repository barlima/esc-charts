# Eurovision Songs Import Script

This script allows you to import Eurovision song data from CSV files into the Supabase database.

## Usage

```bash
npm run import-songs -- --country <CountryName> [--file <csvfile>]
```

### Examples

```bash
# Import Germany's data from Germany.csv
npm run import-songs -- --country Germany --file Germany.csv

# Import Poland's data (will look for Poland.csv in current directory)
npm run import-songs -- --country Poland

# Import from a specific file path
npm run import-songs -- --country "United Kingdom" --file /path/to/uk-data.csv
```

## CSV Format

The CSV file must have the following columns (semicolon-separated):

- `YEAR`: Contest year (e.g., 2024, 2023, etc.)
- `SONG`: Song title and artist on separate lines (e.g., "Satellite\nLena")
- `PLACE`: Final placement (e.g., 1, 2, 3, or "Didn't qualify")
- `POINTS`: Points received in the final
- `QUALIFICATION`: Qualification status (e.g., "Big 5", "Big 4", "semi-final 1", "cancelled")

### Example CSV Format

```csv
YEAR;SONG;PLACE;POINTS;QUALIFICATION;;
2024;"Always on the Run  
Isaak";12;117;Big 5;;
2023;"Blood & Glitter  
Lord Of The Lost";26;18;Big 5;;
2010;"Satellite  
Lena";1;246;Big 4;;
```

## Features

- **Smart Parsing**: Automatically handles different qualification statuses (Big 5, semifinals, etc.)
- **Update Existing**: Updates existing entries if they already exist in the database
- **Insert New**: Adds new entries for missing years
- **Venue Types**: Correctly assigns venue types (final, semifinal1, semifinal2)
- **Qualification Logic**: Properly handles qualification status for semifinal era (2004+)
- **Error Handling**: Skips invalid entries and provides detailed logging

## Qualification Status Handling

The script intelligently handles different qualification scenarios:

- **Big 5/Big 4**: Automatic qualifiers (goes directly to final)
- **Semi-final entries**: Creates both semifinal and final entries if qualified
- **Non-qualifiers**: Creates only semifinal entry with qualified=false
- **Pre-2004**: All entries go to final (no semifinal system)
- **Cancelled years**: Skips entries (e.g., 2020)

## Database Requirements

The script requires:
- Country must exist in the `countries` table
- Contest years must exist in the `contests` table
- Proper Supabase connection (uses same config as other scripts)

## Output

The script provides detailed logging:
- Updated entries (existing songs with new data)
- Inserted entries (new songs added)
- Skipped entries (invalid or missing contest data)
- Final summary with counts

## Error Handling

Common issues and solutions:

1. **Country not found**: Ensure the country name matches exactly what's in the database
2. **Contest not found**: Make sure contest years exist in the contests table
3. **CSV format errors**: Check that the CSV has the required columns and proper formatting
4. **Invalid song format**: Song field must have title and artist on separate lines

## Notes

- The script uses the same Supabase configuration as other scripts in this project
- It's safe to run multiple times - existing entries will be updated, not duplicated
- The script handles both historical data (pre-semifinal era) and modern data (semifinal era)
- Special characters and non-English text are supported 