import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import { config } from "dotenv";
import fs from "fs";

// Load environment variables from .env file if exists
config();

// Supabase connection details
const supabaseUrl =
  process.env.SUPABASE_URL || "https://cjpfhkjvbgqimoxkoyxx.supabase.co";
const supabaseKey =
  process.env.SUPABASE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqcGZoa2p2YmdxaW1veGtveXh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NDExMjAsImV4cCI6MjA2MzMxNzEyMH0.FCdb6iqIlgtqwfCDArreqVGP3vBTAsADb5OBi2r3tMI";
const supabase = createClient(supabaseUrl, supabaseKey);

// Type definitions based on database schema
type Contest = {
  id?: number;
  year: number;
  host_country: string;
  host_city: string;
  slogan?: string;
  logo_url?: string;
  created_at?: string;
};

type Country = {
  id?: number;
  name: string;
  code: string;
  flag_url?: string;
  first_participation_year?: number;
  wins?: number;
  created_at?: string;
};

type Venue = {
  id?: number;
  contest_id: number;
  type: "final" | "semifinal1" | "semifinal2";
  created_at?: string;
};

type Song = {
  id?: number;
  contest_id: number;
  country_id: number;
  title: string;
  artist: string;
  lyrics?: string;
  youtube_url?: string;
  spotify_url?: string;
  running_order?: number;
  final_place?: number;
  points?: number;
  qualified?: boolean;
  venue_type: "final" | "semifinal1" | "semifinal2";
  created_at?: string;
};

type Vote = {
  id?: number;
  contest_id: number;
  from_country_id: number;
  to_country_id: number;
  points: number;
  venue_id: number;
  jury_or_televote: "jury" | "televote" | "combined";
  song_id?: number;
  created_at?: string;
};

// Eurovision Song Contest data with real information
// Format: {yearCountry: { title, artist, finalPlace }}
const songData: Record<string, { title: string; artist: string; finalPlace?: number }> = {
  // Winners and notable entries
  "1975Netherlands": { title: "Ding-a-dong", artist: "Teach-In", finalPlace: 1 },
  "1976United Kingdom": { title: "Save Your Kisses for Me", artist: "Brotherhood of Man", finalPlace: 1 },
  "1977France": { title: "L'oiseau et l'enfant", artist: "Marie Myriam", finalPlace: 1 },
  "1978Israel": { title: "A-Ba-Ni-Bi", artist: "Izhar Cohen & the Alphabeta", finalPlace: 1 },
  "1979Israel": { title: "Hallelujah", artist: "Milk and Honey", finalPlace: 1 },
  "1980Ireland": { title: "What's Another Year", artist: "Johnny Logan", finalPlace: 1 },
  "1981United Kingdom": { title: "Making Your Mind Up", artist: "Bucks Fizz", finalPlace: 1 },
  "1982Germany": { title: "Ein bißchen Frieden", artist: "Nicole", finalPlace: 1 },
  "1983Luxembourg": { title: "Si la vie est cadeau", artist: "Corinne Hermès", finalPlace: 1 },
  "1984Sweden": { title: "Diggi-Loo Diggi-Ley", artist: "Herreys", finalPlace: 1 },
  "1985Norway": { title: "La det swinge", artist: "Bobbysocks", finalPlace: 1 },
  "1986Belgium": { title: "J'aime la vie", artist: "Sandra Kim", finalPlace: 1 },
  "1987Ireland": { title: "Hold Me Now", artist: "Johnny Logan", finalPlace: 1 },
  "1988Switzerland": { title: "Ne partez pas sans moi", artist: "Celine Dion", finalPlace: 1 },
  "1989Yugoslavia": { title: "Rock Me", artist: "Riva", finalPlace: 1 },
  "1990Italy": { title: "Insieme: 1992", artist: "Toto Cutugno", finalPlace: 1 },
  "1991Sweden": { title: "Fångad av en stormvind", artist: "Carola", finalPlace: 1 },
  "1992Ireland": { title: "Why Me?", artist: "Linda Martin", finalPlace: 1 },
  "1993Ireland": { title: "In Your Eyes", artist: "Niamh Kavanagh", finalPlace: 1 },
  "1994Ireland": { title: "Rock 'n' Roll Kids", artist: "Paul Harrington & Charlie McGettigan", finalPlace: 1 },
  "1995Norway": { title: "Nocturne", artist: "Secret Garden", finalPlace: 1 },
  "1996Ireland": { title: "The Voice", artist: "Eimear Quinn", finalPlace: 1 },
  "1997United Kingdom": { title: "Love Shine a Light", artist: "Katrina & The Waves", finalPlace: 1 },
  "1998Israel": { title: "Diva", artist: "Dana International", finalPlace: 1 },
  "1999Sweden": { title: "Take Me to Your Heaven", artist: "Charlotte Nilsson", finalPlace: 1 },
  "2000Denmark": { title: "Fly on the Wings of Love", artist: "Olsen Brothers", finalPlace: 1 },
  "2001Estonia": { title: "Everybody", artist: "Tanel Padar, Dave Benton & 2XL", finalPlace: 1 },
  "2002Latvia": { title: "I Wanna", artist: "Marie N", finalPlace: 1 },
  "2003Turkey": { title: "Everyway That I Can", artist: "Sertab Erener", finalPlace: 1 },
  "2004Ukraine": { title: "Wild Dances", artist: "Ruslana", finalPlace: 1 },
  "2005Greece": { title: "My Number One", artist: "Helena Paparizou", finalPlace: 1 },
  "2006Finland": { title: "Hard Rock Hallelujah", artist: "Lordi", finalPlace: 1 },
  "2007Serbia": { title: "Molitva", artist: "Marija Šerifović", finalPlace: 1 },
  "2008Russia": { title: "Believe", artist: "Dima Bilan", finalPlace: 1 },
  "2009Norway": { title: "Fairytale", artist: "Alexander Rybak", finalPlace: 1 },
  "2010Germany": { title: "Satellite", artist: "Lena", finalPlace: 1 },
  "2011Azerbaijan": { title: "Running Scared", artist: "Ell & Nikki", finalPlace: 1 },
  "2012Sweden": { title: "Euphoria", artist: "Loreen", finalPlace: 1 },
  "2013Denmark": { title: "Only Teardrops", artist: "Emmelie de Forest", finalPlace: 1 },
  "2014Austria": { title: "Rise Like a Phoenix", artist: "Conchita Wurst", finalPlace: 1 },
  "2015Sweden": { title: "Heroes", artist: "Måns Zelmerlöw", finalPlace: 1 },
  "2016Ukraine": { title: "1944", artist: "Jamala", finalPlace: 1 },
  "2017Portugal": { title: "Amar pelos dois", artist: "Salvador Sobral", finalPlace: 1 },
  "2018Israel": { title: "Toy", artist: "Netta", finalPlace: 1 },
  "2019Netherlands": { title: "Arcade", artist: "Duncan Laurence", finalPlace: 1 },
  
  // Some other notable entries
  "2019Italy": { title: "Soldi", artist: "Mahmood", finalPlace: 2 },
  "2019Russia": { title: "Scream", artist: "Sergey Lazarev", finalPlace: 3 },
  "2019Switzerland": { title: "She Got Me", artist: "Luca Hänni", finalPlace: 4 },
  "2019Sweden": { title: "Too Late for Love", artist: "John Lundvik", finalPlace: 5 },
  "2019Norway": { title: "Spirit in the Sky", artist: "KEiiNO", finalPlace: 6 },
  
  "2018Cyprus": { title: "Fuego", artist: "Eleni Foureira", finalPlace: 2 },
  "2018Austria": { title: "Nobody but You", artist: "Cesár Sampson", finalPlace: 3 },
  "2018Germany": { title: "You Let Me Walk Alone", artist: "Michael Schulte", finalPlace: 4 },
  "2018Italy": { title: "Non mi avete fatto niente", artist: "Ermal Meta & Fabrizio Moro", finalPlace: 5 },
  
  "2017Bulgaria": { title: "Beautiful Mess", artist: "Kristian Kostov", finalPlace: 2 },
  "2017Moldova": { title: "Hey Mamma", artist: "SunStroke Project", finalPlace: 3 },
  "2017Belgium": { title: "City Lights", artist: "Blanche", finalPlace: 4 },
  "2017Sweden": { title: "I Can't Go On", artist: "Robin Bengtsson", finalPlace: 5 },
};

// Maps for caching entities
const countriesMap: Map<string, number> = new Map();
const contestsMap: Map<number, number> = new Map();
const venuesMap: Map<string, number> = new Map();
const songsMap: Map<string, number> = new Map();

// Helper function to get venue type from the second segment of the contest code
const getVenueType = (
  contestCode: string
): "final" | "semifinal1" | "semifinal2" => {
  if (contestCode.includes("sf1")) {
    return "semifinal1";
  } else if (contestCode.includes("sf2")) {
    return "semifinal2";
  } else if (contestCode.includes("sf")) {
    return "semifinal1";
  } else {
    return "final";
  }
};

// Parse command line arguments
const shouldCleanup =
  process.argv.includes("--cleanup") || process.argv.includes("-c");

async function cleanDatabase() {
  console.log("Cleaning up database...");

  // Delete data in reverse order of dependencies
  await supabase.from("votes").delete().neq("id", 0);
  await supabase.from("songs").delete().neq("id", 0);
  await supabase.from("venues").delete().neq("id", 0);
  await supabase.from("contests").delete().neq("id", 0);
  await supabase.from("countries").delete().neq("id", 0);

  console.log("Database cleaned up successfully");
}

async function populateDatabase() {
  console.log("Starting database population...");

  // Read Excel file
  const filePath = path.join(
    process.cwd(),
    "data",
    "eurovision_song_contest_1975_2019.xlsx"
  );
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

  console.log(`Loaded ${data.length} rows from Excel file`);

  // Process data
  const countries = new Set<string>();
  const contests = new Set<number>();
  const venueTypes = new Map<string, Set<string>>();

  // First pass: collect unique entities
  for (const row of data) {
    const record = Object.values(row as any) as any[];

    // Extract fields from row
    const year = Number(record[0] || 0);
    const roundCode = record[1] || "";
    const contestCode = record[2] || "";
    const juryOrTelevote = record[3] === "J" ? "jury" : "televote";
    const fromCountry = record[4] || "";
    const toCountry = record[5] || "";
    const points = Number(record[6] || 0);
    const isSelfVote = record[7] === "x";

    // Skip invalid data
    if (!year || !fromCountry || !toCountry || points <= 0 || isSelfVote) {
      continue;
    }

    // Collect unique countries
    countries.add(fromCountry);
    countries.add(toCountry);

    // Collect unique contests
    contests.add(year);

    // Collect venue types per contest
    if (!venueTypes.has(contestCode)) {
      venueTypes.set(contestCode, new Set<string>());
    }
    venueTypes.get(contestCode)?.add(getVenueType(contestCode));
  }

  // Create countries
  console.log(`Inserting ${countries.size} countries...`);
  for (const countryName of countries) {
    const country: Country = {
      name: countryName,
      code: countryName.substring(0, 10).toUpperCase(),
    };

    

    const { data: insertedCountry, error } = await supabase
      .from("countries")
      .insert(country)
      .select("id")
      .single();

    if (error) {
      console.error(`Error inserting country ${countryName}:`, error);
      continue;
    }

    countriesMap.set(countryName, insertedCountry.id);
    console.log(
      `Inserted country: ${countryName} with ID ${insertedCountry.id} and code ${country.code}`
    );
  }

  // Create contests
  console.log(`Inserting ${contests.size} contests...`);
  for (const year of contests) {
    // For simplicity, set host country based on hard-coded data or the year
    let hostCountry = "Unknown";
    let hostCity = "Unknown";

    // This could be enhanced with actual data from a different source
    if (year === 2019) {
      hostCountry = "Israel";
      hostCity = "Tel Aviv";
    } else if (year === 2018) {
      hostCountry = "Portugal";
      hostCity = "Lisbon";
    } else if (year === 2017) {
      hostCountry = "Ukraine";
      hostCity = "Kyiv";
    } else if (year === 2016) {
      hostCountry = "Sweden";
      hostCity = "Stockholm";
    } else if (year === 2015) {
      hostCountry = "Austria";
      hostCity = "Vienna";
    }

    const contest: Contest = {
      year,
      host_country: hostCountry,
      host_city: hostCity,
    };

    const { data: insertedContest, error } = await supabase
      .from("contests")
      .insert(contest)
      .select("id")
      .single();

    if (error) {
      console.error(`Error inserting contest for year ${year}:`, error);
      continue;
    }

    contestsMap.set(year, insertedContest.id);
    console.log(`Inserted contest: ${year} with ID ${insertedContest.id}`);
  }

  // Create venues
  console.log(`Inserting venues...`);
  for (const [contestCode, venueTypeSet] of venueTypes.entries()) {
    const year = Number(contestCode.substring(0, 4));
    const contestId = contestsMap.get(year);

    if (!contestId) {
      console.error(`Contest ID not found for year ${year}`);
      continue;
    }

    for (const venueType of venueTypeSet) {
      const venue: Venue = {
        contest_id: contestId,
        type: venueType as "final" | "semifinal1" | "semifinal2",
      };

      const { data: insertedVenue, error } = await supabase
        .from("venues")
        .insert(venue)
        .select("id")
        .single();

      if (error) {
        console.error(
          `Error inserting venue for contest ${year}, type ${venueType}:`,
          error
        );
        continue;
      }

      const venueKey = `${year}-${venueType}`;
      venuesMap.set(venueKey, insertedVenue.id);
      console.log(`Inserted venue: ${venueKey} with ID ${insertedVenue.id}`);
    }
  }

  // For songs, we'll need to aggregate by country and contest
  const songEntries = new Map<
    string,
    { country: string; year: number; venueType: string }
  >();

  // Second pass for votes and songs
  console.log("Processing votes and creating songs...");
  for (const row of data) {
    const record = Object.values(row as any) as any[];

    // Extract fields from row
    const year = Number(record[0] || 0);
    const roundCode = record[1] || "";
    const contestCode = record[2] || "";
    const juryOrTelevote = record[3] === "J" ? "jury" : "televote";
    const fromCountry = record[4] || "";
    const toCountry = record[5] || "";
    const points = Number(record[6] || 0);
    const isSelfVote = record[7] === "x";

    // Skip invalid data or self-votes
    if (!year || !fromCountry || !toCountry || points <= 0 || isSelfVote) {
      continue;
    }

    const venueType = getVenueType(contestCode);
    const contestId = contestsMap.get(year);
    const fromCountryId = countriesMap.get(fromCountry);
    const toCountryId = countriesMap.get(toCountry);
    const venueKey = `${year}-${venueType}`;
    const venueId = venuesMap.get(venueKey);

    if (!contestId || !fromCountryId || !toCountryId || !venueId) {
      console.error(
        `Missing reference for vote: year=${year}, from=${fromCountry}, to=${toCountry}`
      );
      continue;
    }

    // Create song entry if not exists
    const songKey = `${year}-${toCountry}-${venueType}`;
    if (!songEntries.has(songKey)) {
      songEntries.set(songKey, { country: toCountry, year, venueType });
    }

    // For the receiving country, ensure we have a song
    if (!songsMap.has(songKey)) {
      // Look up song data from our predefined mapping
      const songDataKey = `${year}${toCountry}`;
      const realSongData = songData[songDataKey] || {
        title: `Song from ${toCountry}`,
        artist: `Artist from ${toCountry}`,
        finalPlace: undefined
      };

      const song: Song = {
        contest_id: contestId,
        country_id: toCountryId,
        title: realSongData.title,
        artist: realSongData.artist,
        final_place: realSongData.finalPlace,
        venue_type: venueType as "final" | "semifinal1" | "semifinal2",
      };

      const { data: insertedSong, error } = await supabase
        .from("songs")
        .insert(song)
        .select("id")
        .single();

      if (error) {
        console.error(`Error inserting song for ${songKey}:`, error);
        continue;
      }

      songsMap.set(songKey, insertedSong.id);
      console.log(`Inserted song: ${songKey} with ID ${insertedSong.id}`);
    }

    // Create vote
    const vote: Vote = {
      contest_id: contestId,
      from_country_id: fromCountryId,
      to_country_id: toCountryId,
      points,
      venue_id: venueId,
      jury_or_televote: juryOrTelevote as "jury" | "televote" | "combined",
      song_id: songsMap.get(songKey),
    };

    const { error } = await supabase.from("votes").insert(vote);

    if (error) {
      console.error(
        `Error inserting vote from ${fromCountry} to ${toCountry} in ${year}:`,
        error
      );
    }
  }

  console.log("Database population completed!");
}

// Main execution
async function main() {
  try {
    if (shouldCleanup) {
      await cleanDatabase();
    }
    await populateDatabase();
    console.log("Script completed successfully!");
  } catch (error) {
    console.error("Error executing script:", error);
    process.exit(1);
  }
}

main();
