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
  song_id: number;
};

type SongData = {
  contest_id: number;
  country_id: number;
  venue_type: string;
  artist: string;
  title: string;
  points: number;
};

type CountryVotes = {
  country_id: number;
  jury_points: number;
  televote_points: number;
  total_points: number;
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

async function getOrCreateVenue(contestId: number, venueType: string): Promise<{ id: number; type: string }> {
  const dbVenueType = venueType === "sm1" ? "semifinal1" : 
                      venueType === "sm2" ? "semifinal2" : 
                      "final";

  // Check if venue exists
  const { data: venues, error } = await supabase
    .from("venues")
    .select("id, type")
    .eq("contest_id", contestId)
    .eq("type", dbVenueType)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  if (venues) {
    return { id: venues.id, type: venues.type };
  }

  // Create new venue
  const { data: newVenue, error: insertError } = await supabase
    .from("venues")
    .insert({
      contest_id: contestId,
      type: dbVenueType,
    })
    .select("id, type")
    .single();

  if (insertError) {
    throw insertError;
  }

  return { id: newVenue.id, type: newVenue.type };
}

function extractCountryVotesFromCSV(
  juryFilePath: string,
  televoteFilePath: string
): CountryVotes[] {
  const countryVotesMap = new Map<number, CountryVotes>();

  // Parse jury votes
  if (fs.existsSync(juryFilePath)) {
    console.log(`Parsing jury votes from ${juryFilePath}...`);
    const juryContent = fs.readFileSync(juryFilePath, "utf-8");
    const juryData = parseCSV(juryContent);

    for (const row of juryData) {
      const countryName = row.to_country;
      const countryId = getCountryId(countryName);
      const juryPoints = parseInt(row.total || "0", 10);

      if (countryId) {
        const existing = countryVotesMap.get(countryId) || {
          country_id: countryId,
          jury_points: 0,
          televote_points: 0,
          total_points: 0,
        };
        existing.jury_points = juryPoints;
        countryVotesMap.set(countryId, existing);
      }
    }
  }

  // Parse televote votes
  if (fs.existsSync(televoteFilePath)) {
    console.log(`Parsing televote votes from ${televoteFilePath}...`);
    const televoteContent = fs.readFileSync(televoteFilePath, "utf-8");
    const televoteData = parseCSV(televoteContent);

    for (const row of televoteData) {
      const countryName = row.to_country;
      const countryId = getCountryId(countryName);
      const televotePoints = parseInt(row.total || "0", 10);

      if (countryId) {
        const existing = countryVotesMap.get(countryId) || {
          country_id: countryId,
          jury_points: 0,
          televote_points: 0,
          total_points: 0,
        };
        existing.televote_points = televotePoints;
        countryVotesMap.set(countryId, existing);
      }
    }
  }

  // Calculate total points
  const result = Array.from(countryVotesMap.values());
  for (const country of result) {
    country.total_points = country.jury_points + country.televote_points;
  }

  return result;
}

async function cleanExistingSongs(contestId: number, venueType: string): Promise<void> {
  console.log("Cleaning existing songs for this contest and venue type...");
  
  const { error } = await supabase
    .from("songs")
    .delete()
    .eq("contest_id", contestId)
    .eq("venue_type", venueType);

  if (error) {
    console.error("Error cleaning existing songs:", error);
    throw error;
  }

  console.log("Existing songs cleaned");
}

async function createSongs(
  contestId: number,
  venueType: string,
  countryVotes: CountryVotes[]
): Promise<Map<number, number>> {
  console.log(`Creating ${countryVotes.length} songs for venue ${venueType}...`);

  const songs: SongData[] = countryVotes.map(cv => ({
    contest_id: contestId,
    country_id: cv.country_id,
    venue_type: venueType,
    artist: "TBD", // Placeholder, can be updated later
    title: "TBD", // Placeholder, can be updated later
    points: cv.total_points,
  }));

  const { data: insertedSongs, error } = await supabase
    .from("songs")
    .insert(songs)
    .select("id, country_id");

  if (error) {
    console.error("Error creating songs:", error);
    throw error;
  }

  // Create mapping from country_id to song_id
  const countryToSongMap = new Map<number, number>();
  for (const song of insertedSongs) {
    countryToSongMap.set(song.country_id, song.id);
  }

  console.log(`Successfully created ${insertedSongs.length} songs`);
  return countryToSongMap;
}

async function importVotesFromCSV(
  filePath: string,
  contestId: number,
  venueId: number,
  voteType: "jury" | "televote",
  countryToSongMap: Map<number, number>
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
      console.warn(`Unknown to_country: ${toCountryName}`);
      continue;
    }

    const songId = countryToSongMap.get(toCountryId);
    if (!songId) {
      console.warn(`No song found for country: ${toCountryName}`);
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
        console.warn(`Unknown from_country: ${fromCountryName}`);
        continue;
      }

      votes.push({
        contest_id: contestId,
        from_country_id: fromCountryId,
        to_country_id: toCountryId,
        points,
        venue_id: venueId,
        jury_or_televote: voteType,
        song_id: songId,
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

async function main() {
  try {
    const { year, venue } = parseArguments();

    console.log(`Importing votes for year ${year}, venue ${venue}`);

    // Get or create contest
    const contestId = await getOrCreateContest(year);
    console.log(`Contest ID: ${contestId}`);

    // Get or create venue
    const venueData = await getOrCreateVenue(contestId, venue);
    console.log(`Venue ID: ${venueData.id}, Type: ${venueData.type}`);

    // Construct file paths
    const juryFile = path.join(process.cwd(), "data", `${year}_${venue}_jury.csv`);
    const publicFile = path.join(process.cwd(), "data", `${year}_${venue}_public.csv`);

    // Extract countries and their total points from CSV files
    const countryVotes = extractCountryVotesFromCSV(juryFile, publicFile);
    console.log(`Found ${countryVotes.length} countries with votes`);

    if (countryVotes.length === 0) {
      console.error("No countries found in CSV files. Please check the file format.");
      process.exit(1);
    }

    // Clean existing songs and votes for this contest and venue
    await cleanExistingSongs(contestId, venueData.type);
    await cleanExistingVotes(contestId, venueData.id);

    // Create songs for each country
    const countryToSongMap = await createSongs(
      contestId,
      venueData.type,
      countryVotes
    );

    // Import votes with proper song_id links
    await importVotesFromCSV(juryFile, contestId, venueData.id, "jury", countryToSongMap);
    await importVotesFromCSV(publicFile, contestId, venueData.id, "televote", countryToSongMap);

    console.log("Import completed successfully!");
    console.log(`Created ${countryVotes.length} songs and imported all votes with proper links.`);
  } catch (error) {
    console.error("Error during import:", error);
    process.exit(1);
  }
}

main(); 