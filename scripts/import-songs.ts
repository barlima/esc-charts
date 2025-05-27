import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env file if exists
config();

// Types
interface CSVRow {
  YEAR: string;
  SONG: string;
  PLACE: string;
  POINTS: string;
  QUALIFICATION: string;
}

interface ParsedSong {
  year: number;
  title: string;
  artist: string;
  finalPlace: number | null;
  points: number | null;
  qualified: boolean | null;
  venueType: 'final' | 'semifinal1' | 'semifinal2';
}

// Supabase connection details
const supabaseUrl = process.env.SUPABASE_URL || 'https://cjpfhkjvbgqimoxkoyxx.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqcGZoa2p2YmdxaW1veGtveXh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NDExMjAsImV4cCI6MjA2MzMxNzEyMH0.FCdb6iqIlgtqwfCDArreqVGP3vBTAsADb5OBi2r3tMI';

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions
function parseCSVRow(row: CSVRow): ParsedSong[] {
  const year = parseInt(row.YEAR);
  
  // Skip invalid years or future entries
  if (isNaN(year) || year < 1956 || year > 2025) {
    return [];
  }

  // Parse song and artist from combined field
  const songArtist = row.SONG.trim();
  const lines = songArtist.split('\n').map(line => line.trim()).filter(line => line);
  
  if (lines.length < 2) {
    console.warn(`Skipping ${year}: Invalid song/artist format`);
    return [];
  }

  const title = lines[0].replace(/^"/, '').replace(/"$/, ''); // Remove quotes
  const artist = lines[1].replace(/^"/, '').replace(/"$/, ''); // Remove quotes from artist too

  // Parse place
  let finalPlace: number | null = null;
  const placeStr = row.PLACE.trim();
  if (placeStr && placeStr !== '–' && placeStr !== 'Didn\'t qualify') {
    const placeMatch = placeStr.match(/^#?(\d+)$/);
    if (placeMatch) {
      finalPlace = parseInt(placeMatch[1]);
    }
  }

  // Parse points
  let points: number | null = null;
  const pointsStr = row.POINTS.trim();
  if (pointsStr && pointsStr !== '–' && !isNaN(parseInt(pointsStr))) {
    points = parseInt(pointsStr);
  }

  // Parse qualification info
  let qualified: boolean | null = null;
  let venueType: 'final' | 'semifinal1' | 'semifinal2' = 'final';
  let semifinalPlace: number | null = null;
  
  const qualification = row.QUALIFICATION.trim();
  
  if (qualification.includes('Big 5') || qualification.includes('Big 4') || qualification === 'winner' || qualification.includes('Top-10')) {
    // Automatic qualifier or previous winner
    qualified = true;
    venueType = 'final';
  } else if (qualification.includes('cancelled')) {
    // Cancelled year (2020)
    return [];
  } else if (qualification.includes('#') && (qualification.includes('in semi-final') || qualification.includes('in semifinal') || qualification.includes('in qualification'))) {
    // Handle patterns like "#15 in semi-final 2", "#8 in semi-final 2", "#18 in semi-final", or "#5 in qualification"
    const semifinalMatchWithNumber = qualification.match(/#(\d+) in semi-final (\d)/);
    const semifinalMatchGeneric = qualification.match(/#(\d+) in semi-final/);
    const qualificationMatch = qualification.match(/#(\d+) in qualification/);
    
    if (semifinalMatchWithNumber) {
      semifinalPlace = parseInt(semifinalMatchWithNumber[1]);
      const semifinalNumber = parseInt(semifinalMatchWithNumber[2]);
      venueType = semifinalNumber === 1 ? 'semifinal1' : 'semifinal2';
    } else if (semifinalMatchGeneric) {
      semifinalPlace = parseInt(semifinalMatchGeneric[1]);
      // For generic "semi-final" without number, default to semifinal1
      venueType = 'semifinal1';
    } else if (qualificationMatch) {
      semifinalPlace = parseInt(qualificationMatch[1]);
      // For qualification rounds (pre-semifinal era), treat as semifinal1
      venueType = 'semifinal1';
    } else {
      // Fallback parsing
      if (qualification.includes('semi-final 1') || qualification.includes('semifinal 1')) {
        venueType = 'semifinal1';
      } else if (qualification.includes('semi-final 2') || qualification.includes('semifinal 2')) {
        venueType = 'semifinal2';
      } else {
        venueType = 'semifinal1'; // Default
      }
    }
    
    qualified = placeStr !== 'Didn\'t qualify';
  } else if (qualification.includes('semi-final') || qualification.includes('semifinal')) {
    // Extract semifinal info
    if (qualification.includes('semi-final 1') || qualification.includes('semifinal 1')) {
      venueType = 'semifinal1';
    } else if (qualification.includes('semi-final 2') || qualification.includes('semifinal 2')) {
      venueType = 'semifinal2';
    } else if (qualification.includes('semi-final') || qualification.includes('semifinal')) {
      venueType = 'semifinal1'; // Default for generic semifinal
    }
    
    qualified = placeStr !== 'Didn\'t qualify';
  } else if (placeStr === 'Didn\'t qualify') {
    qualified = false;
    // Try to determine semifinal from qualification column
    if (qualification.includes('semi-final 1') || qualification.includes('semifinal 1')) {
      venueType = 'semifinal1';
    } else if (qualification.includes('semi-final 2') || qualification.includes('semifinal 2')) {
      venueType = 'semifinal2';
    } else {
      venueType = 'semifinal1'; // Default
    }
  } else if (finalPlace !== null) {
    // Has final place, so qualified
    qualified = true;
    venueType = 'final';
  }

  const songs: ParsedSong[] = [];

  // For semifinal era (2004+), handle semifinal and final entries
  if (year >= 2004) {
    // Add semifinal entry if it's not a Big 5/Big 4 country
    if (venueType !== 'final') {
      songs.push({
        year,
        title,
        artist,
        finalPlace: semifinalPlace, // Use semifinal placement for non-qualifiers
        points: null, // Semifinal points are usually not tracked in this format
        qualified,
        venueType
      });
    }

    // Add final entry if qualified (has final place or is Big 5/Big 4)
    if (qualified) {
      songs.push({
        year,
        title,
        artist,
        finalPlace,
        points,
        qualified: true,
        venueType: 'final'
      });
    }
  } else {
    // Pre-semifinal era (before 2004)
    if (semifinalPlace !== null) {
      // Has qualification placement
      songs.push({
        year,
        title,
        artist,
        finalPlace: semifinalPlace,
        points: null,
        qualified: finalPlace !== null, // Qualified if has final place
        venueType: 'semifinal1' // Treat qualification round as semifinal1
      });
      
      // If qualified to final, also add final entry
      if (finalPlace !== null) {
        songs.push({
          year,
          title,
          artist,
          finalPlace,
          points,
          qualified: true,
          venueType: 'final'
        });
      }
    } else {
      // Regular final entry (qualified or no qualification round)
      songs.push({
        year,
        title,
        artist,
        finalPlace,
        points,
        qualified: null,
        venueType: 'final'
      });
    }
  }

  return songs;
}

async function getCountryId(countryName: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('countries')
    .select('id')
    .ilike('name', countryName)
    .single();

  if (error) {
    console.error(`Error finding country ${countryName}:`, error);
    return null;
  }

  return data?.id || null;
}

async function getContestId(year: number): Promise<number | null> {
  const { data, error } = await supabase
    .from('contests')
    .select('id')
    .eq('year', year)
    .single();

  if (error) {
    console.warn(`Contest for year ${year} not found`);
    return null;
  }

  return data?.id || null;
}

async function getExistingSongs(countryId: number): Promise<any[]> {
  const { data, error } = await supabase
    .from('songs')
    .select(`
      id,
      title,
      artist,
      final_place,
      points,
      qualified,
      venue_type,
      contests!inner(year)
    `)
    .eq('country_id', countryId);

  if (error) {
    console.error('Error fetching existing songs:', error);
    return [];
  }

  return data || [];
}

async function updateSong(songId: number, song: ParsedSong): Promise<boolean> {
  const { error } = await supabase
    .from('songs')
    .update({
      title: song.title,
      artist: song.artist,
      final_place: song.finalPlace,
      points: song.points,
      qualified: song.qualified
    })
    .eq('id', songId);

  if (error) {
    console.error(`Error updating song ${songId}:`, error);
    return false;
  }

  return true;
}

async function insertSong(countryId: number, contestId: number, song: ParsedSong): Promise<boolean> {
  const { error } = await supabase
    .from('songs')
    .insert({
      contest_id: contestId,
      country_id: countryId,
      title: song.title,
      artist: song.artist,
      final_place: song.finalPlace,
      points: song.points,
      qualified: song.qualified,
      venue_type: song.venueType
    });

  if (error) {
    console.error(`Error inserting song for ${song.year}:`, error);
    return false;
  }

  return true;
}

async function importSongs(countryName: string, csvFilePath: string): Promise<void> {
  console.log(`Importing songs for ${countryName} from ${csvFilePath}`);

  // Get country ID
  const countryId = await getCountryId(countryName);
  if (!countryId) {
    console.error(`Country ${countryName} not found in database`);
    return;
  }

  // Read and parse CSV
  const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    console.error('CSV file must have at least a header and one data row');
    return;
  }
  
  // Parse header
  const header = lines[0].split(';').map(col => col.trim());
  const yearIndex = header.indexOf('YEAR');
  const songIndex = header.indexOf('SONG');
  const placeIndex = header.indexOf('PLACE');
  const pointsIndex = header.indexOf('POINTS');
  const qualificationIndex = header.indexOf('QUALIFICATION');
  
  if (yearIndex === -1 || songIndex === -1 || placeIndex === -1 || pointsIndex === -1 || qualificationIndex === -1) {
    console.error('CSV must have columns: YEAR, SONG, PLACE, POINTS, QUALIFICATION');
    return;
  }
  
  // Parse data rows - handle multi-line entries properly
  const records: CSVRow[] = [];
  let currentRow = '';
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // If line starts with a year (4 digits), it's a new record
    if (/^\d{4};/.test(line)) {
      // Process previous row if exists
      if (currentRow) {
        const cols = currentRow.split(';');
        if (cols.length >= 5) {
          records.push({
            YEAR: cols[yearIndex]?.trim() || '',
            SONG: cols[songIndex]?.trim() || '',
            PLACE: cols[placeIndex]?.trim() || '',
            POINTS: cols[pointsIndex]?.trim() || '',
            QUALIFICATION: cols[qualificationIndex]?.trim() || ''
          });
        }
      }
      currentRow = line;
    } else {
      // This is a continuation line (artist name)
      currentRow += '\n' + line;
    }
  }
  
  // Process the last row
  if (currentRow) {
    const cols = currentRow.split(';');
    if (cols.length >= 5) {
      records.push({
        YEAR: cols[yearIndex]?.trim() || '',
        SONG: cols[songIndex]?.trim() || '',
        PLACE: cols[placeIndex]?.trim() || '',
        POINTS: cols[pointsIndex]?.trim() || '',
        QUALIFICATION: cols[qualificationIndex]?.trim() || ''
      });
    }
  }

  // Get existing songs
  const existingSongs = await getExistingSongs(countryId);
  const existingSongMap = new Map();
  
  existingSongs.forEach(song => {
    const key = `${song.contests.year}-${song.venue_type}`;
    existingSongMap.set(key, song);
  });

  let updatedCount = 0;
  let insertedCount = 0;
  let skippedCount = 0;

  // Process each CSV row
  for (const row of records) {
    const songs = parseCSVRow(row);
    
    for (const song of songs) {
      const contestId = await getContestId(song.year);
      if (!contestId) {
        console.warn(`Skipping ${song.year}: Contest not found`);
        skippedCount++;
        continue;
      }

      const key = `${song.year}-${song.venueType}`;
      const existingSong = existingSongMap.get(key);

      if (existingSong) {
        // Update existing song
        const success = await updateSong(existingSong.id, song);
        if (success) {
          console.log(`Updated ${song.year} (${song.venueType}): ${song.artist} - ${song.title}`);
          updatedCount++;
        }
      } else {
        // Insert new song
        const success = await insertSong(countryId, contestId, song);
        if (success) {
          console.log(`Inserted ${song.year} (${song.venueType}): ${song.artist} - ${song.title}`);
          insertedCount++;
        }
      }
    }
  }

  console.log(`\nImport completed for ${countryName}:`);
  console.log(`- Updated: ${updatedCount} songs`);
  console.log(`- Inserted: ${insertedCount} songs`);
  console.log(`- Skipped: ${skippedCount} songs`);
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  let countryName = '';
  let csvFilePath = '';
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--country' && i + 1 < args.length) {
      countryName = args[i + 1];
      i++; // Skip next argument
    } else if (args[i] === '--file' && i + 1 < args.length) {
      csvFilePath = args[i + 1];
      i++; // Skip next argument
    } else if (!csvFilePath && args[i].endsWith('.csv')) {
      csvFilePath = args[i];
    }
  }

  if (!countryName) {
    console.error('Usage: npm run import-songs -- --country <CountryName> [--file <csvfile>]');
    console.error('Example: npm run import-songs -- --country Poland --file Poland.csv');
    console.error('If no file is specified, will look for <CountryName>.csv in the current directory');
    process.exit(1);
  }

  // Default CSV file path if not specified
  if (!csvFilePath) {
    csvFilePath = `${countryName}.csv`;
  }

  // Check if file exists
  if (!fs.existsSync(csvFilePath)) {
    console.error(`CSV file not found: ${csvFilePath}`);
    process.exit(1);
  }

  try {
    await importSongs(countryName, csvFilePath);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
} 