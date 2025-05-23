import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { config } from "dotenv";

// Load environment variables from .env file if exists
config();

// Supabase connection details
const supabaseUrl =
  process.env.SUPABASE_URL || "https://cjpfhkjvbgqimoxkoyxx.supabase.co";
const supabaseKey =
  process.env.SUPABASE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqcGZoa2p2YmdxaW1veGtveXh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NDExMjAsImV4cCI6MjA2MzMxNzEyMH0.FCdb6iqIlgtqwfCDArreqVGP3vBTAsADb5OBi2r3tMI";
const supabase = createClient(supabaseUrl, supabaseKey);

// Country name mappings from CSV to database
const COUNTRIES_MAP: Record<string, number> = {
  "Albania": 472,
  "Andorra": 474,
  "Armenia": 478,
  "Australia": 485,
  "Austria": 453,
  "Azerbaijan": 483,
  "Belarus": 475,
  "Belgium": 434,
  "Bosnia & Herzegovina": 459,
  "Bulgaria": 477,
  "Croatia": 460,
  "Cyprus": 457,
  "Czech Republic": 481,
  "Denmark": 455,
  "Estonia": 465,
  "Finland": 445,
  "France": 435,
  "F.Y.R. Macedonia": 469,
  "Georgia": 480,
  "Germany": 450,
  "Greece": 454,
  "Hungary": 462,
  "Iceland": 458,
  "Ireland": 436,
  "Israel": 437,
  "Italy": 438,
  "Latvia": 470,
  "Lithuania": 468,
  "Luxembourg": 446,
  "Macedonia": 486,
  "Malta": 439,
  "Moldova": 476,
  "Monaco": 447,
  "Montenegro": 482,
  "Morocco": 456,
  "North Macedonia": 488,
  "Norway": 451,
  "Poland": 463,
  "Portugal": 449,
  "Romania": 466,
  "Russia": 464,
  "San Marino": 484,
  "Serbia": 479,
  "Serbia & Montenegro": 473,
  "Slovakia": 467,
  "Slovenia": 461,
  "Spain": 440,
  "Sweden": 448,
  "Switzerland": 441,
  "The Netherlands": 442,
  "Turkey": 452,
  "Ukraine": 471,
  "United Kingdom": 443,
  "World": 489,
  "Yugoslavia": 444,
};

// Handle name variations from CSV
const CSV_NAME_MAPPINGS: Record<string, string> = {
  "Luxemburg": "Luxembourg",
  "The Netherlands": "The Netherlands",
  "Netherlands": "The Netherlands",
  "Czech Republic": "Czech Republic",
  "United Kingdom": "United Kingdom",
};

type VoteData = {
  contest_id: number;
  from_country_id: number;
  to_country_id: number;
  points: number;
  venue_id: number;
  jury_or_televote: "jury" | "televote";
  song_id?: number;
};

function parseArguments() {
  const args = process.argv.slice(2);
  let year: number | null = null;
  let venue: string | null = null;

  for (const arg of args) {
    if (arg.startsWith("--year=")) {
      year = parseInt(arg.split("=")[1], 10);
    } else if (arg.startsWith("--venue=")) {
      venue = arg.split("=")[1];
    }
  }

  if (!year || !venue) {
    console.error("Usage: ts-node import-votes.ts --year=YEAR --venue=VENUE");
    console.error("VENUE should be one of: final, sm1, sm2");
    process.exit(1);
  }

  if (!["final", "sm1", "sm2"].includes(venue)) {
    console.error("VENUE should be one of: final, sm1, sm2");
    process.exit(1);
  }

  return { year, venue };
}

function getCountryId(countryName: string): number | null {
  // Handle name mappings first
  const mappedName = CSV_NAME_MAPPINGS[countryName] || countryName;
  return COUNTRIES_MAP[mappedName] || null;
}

function parseCSV(content: string): Record<string, any>[] {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(';');
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(';');
    const row: Record<string, any> = {};
    
    for (let j = 0; j < headers.length; j++) {
      const value = values[j]?.trim();
      row[headers[j]] = value === '' ? null : value;
    }
    
    data.push(row);
  }

  return data;
}

async function getOrCreateContest(year: number): Promise<number> {
  // Check if contest exists
  const { data: contests, error } = await supabase
    .from("contests")
    .select("id")
    .eq("year", year)
    .single();

  if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned
    throw error;
  }

  if (contests) {
    return contests.id;
  }

  // Create new contest
  const { data: newContest, error: insertError } = await supabase
    .from("contests")
    .insert({
      year,
      host_country: "TBD", // Will be updated when we have more data
      host_city: "TBD",
    })
    .select("id")
    .single();

  if (insertError) {
    throw insertError;
  }

  return newContest.id;
}

async function getOrCreateVenue(contestId: number, venueType: string): Promise<number> {
  const dbVenueType = venueType === "sm1" ? "semifinal1" : 
                      venueType === "sm2" ? "semifinal2" : 
                      "final";

  // Check if venue exists
  const { data: venues, error } = await supabase
    .from("venues")
    .select("id")
    .eq("contest_id", contestId)
    .eq("type", dbVenueType)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  if (venues) {
    return venues.id;
  }

  // Create new venue
  const { data: newVenue, error: insertError } = await supabase
    .from("venues")
    .insert({
      contest_id: contestId,
      type: dbVenueType,
    })
    .select("id")
    .single();

  if (insertError) {
    throw insertError;
  }

  return newVenue.id;
}

async function importVotesFromCSV(
  filePath: string,
  contestId: number,
  venueId: number,
  voteType: "jury" | "televote"
): Promise<void> {
  console.log(`Importing ${voteType} votes from ${filePath}...`);

  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const data = parseCSV(content);

  const votes: VoteData[] = [];

  for (const row of data) {
    const toCountryName = row.to_country;
    const toCountryId = getCountryId(toCountryName);

    if (!toCountryId) {
      console.warn(`Unknown country: ${toCountryName}`);
      continue;
    }

    // Process each country's votes to this country
    for (const [fromCountryName, pointsStr] of Object.entries(row)) {
      if (fromCountryName === "to_country" || fromCountryName === "total") {
        continue;
      }

      const points = pointsStr ? parseInt(pointsStr as string, 10) : null;
      if (!points || isNaN(points)) {
        continue;
      }

      const fromCountryId = getCountryId(fromCountryName);
      if (!fromCountryId) {
        console.warn(`Unknown from country: ${fromCountryName}`);
        continue;
      }

      votes.push({
        contest_id: contestId,
        from_country_id: fromCountryId,
        to_country_id: toCountryId,
        points,
        venue_id: venueId,
        jury_or_televote: voteType,
      });
    }
  }

  if (votes.length > 0) {
    console.log(`Inserting ${votes.length} ${voteType} votes...`);
    
    // Insert in batches to avoid potential limits
    const batchSize = 100;
    for (let i = 0; i < votes.length; i += batchSize) {
      const batch = votes.slice(i, i + batchSize);
      const { error } = await supabase.from("votes").insert(batch);

      if (error) {
        console.error(`Error inserting ${voteType} votes batch ${i / batchSize + 1}:`, error);
        throw error;
      }
    }

    console.log(`Successfully imported ${votes.length} ${voteType} votes`);
  } else {
    console.log(`No ${voteType} votes found to import`);
  }
}

async function cleanExistingVotes(contestId: number, venueId: number): Promise<void> {
  console.log("Cleaning existing votes for this contest and venue...");
  
  const { error } = await supabase
    .from("votes")
    .delete()
    .eq("contest_id", contestId)
    .eq("venue_id", venueId);

  if (error) {
    console.error("Error cleaning existing votes:", error);
    throw error;
  }

  console.log("Existing votes cleaned");
}

async function updateVotesWithSongIds(contestId: number, venueId: number): Promise<void> {
  console.log("Note: Votes imported without song_id links.");
  console.log("To link votes to songs, run this SQL query manually in Supabase:");
  
  // First get the venue type for this venue
  const { data: venueData, error: venueError } = await supabase
    .from("venues")
    .select("type")
    .eq("id", venueId)
    .single();

  if (venueError) {
    console.error("Error getting venue type:", venueError);
    return;
  }

  let updateQuery: string;

  if (venueData.type === 'final') {
    // For finals, votes should only link to final songs
    updateQuery = `
UPDATE votes 
SET song_id = s.id
FROM songs s
WHERE votes.contest_id = ${contestId}
  AND votes.venue_id = ${venueId}
  AND votes.to_country_id = s.country_id 
  AND s.contest_id = ${contestId}
  AND s.venue_type = '${venueData.type}'
  AND votes.song_id IS NULL;
    `;
  } else {
    // For semifinals, votes can go to any country in the contest (Eurovision rule)
    // Some countries vote in semifinals but their songs are in the final
    updateQuery = `
UPDATE votes 
SET song_id = s.id
FROM songs s
WHERE votes.contest_id = ${contestId}
  AND votes.venue_id = ${venueId}
  AND votes.to_country_id = s.country_id 
  AND s.contest_id = ${contestId}
  AND votes.song_id IS NULL;
    `;
  }

  console.log(updateQuery);
}

async function main() {
  try {
    const { year, venue } = parseArguments();

    console.log(`Importing votes for year ${year}, venue ${venue}`);

    // Get or create contest
    const contestId = await getOrCreateContest(year);
    console.log(`Contest ID: ${contestId}`);

    // Get or create venue
    const venueId = await getOrCreateVenue(contestId, venue);
    console.log(`Venue ID: ${venueId}`);

    // Clean existing votes for this contest and venue
    await cleanExistingVotes(contestId, venueId);

    // Construct file paths
    const juryFile = path.join(process.cwd(), "data", `${year}_${venue}_jury.csv`);
    const publicFile = path.join(process.cwd(), "data", `${year}_${venue}_public.csv`);

    // Import votes
    await importVotesFromCSV(juryFile, contestId, venueId, "jury");
    await importVotesFromCSV(publicFile, contestId, venueId, "televote");

    // Update votes with song IDs
    await updateVotesWithSongIds(contestId, venueId);

    console.log("Import completed successfully!");
  } catch (error) {
    console.error("Error during import:", error);
    process.exit(1);
  }
}

main(); 