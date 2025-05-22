import { Container, Heading, Text, Box, Flex, Card } from "@radix-ui/themes";
import { getContestByYear, getSongsByContestWithPoints } from "@/app/actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import ChartContainer from "@/components/ChartContainer";

type VenueType = "final" | "semifinal1" | "semifinal2";

type SongWithPoints = {
  id: number;
  country_name: string;
  country_id: number;
  artist: string;
  title: string;
  venue_type: VenueType;
  juryPoints: number | null;
  televotePoints: number | null;
  totalPoints: number | null;
};

// Format venue type to a user-friendly name
function formatVenueType(venueType: VenueType): string {
  switch (venueType) {
    case "final":
      return "Final";
    case "semifinal1":
      return "Semi Final 1";
    case "semifinal2":
      return "Semi Final 2";
    default:
      return venueType;
  }
}

export default async function ContestPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: contestYear } = await params;
  const year = parseInt(contestYear, 10);

  if (isNaN(year)) {
    notFound();
  }

  // Fetch contest data
  const { contest, errorMessage: contestError } = await getContestByYear(year);

  if (!contest) {
    notFound();
  }

  // Fetch songs with pre-calculated points
  const { songs: songsWithPoints, errorMessage: songsError } =
    await getSongsByContestWithPoints(contest.id);

  // Group songs by venue type
  const songsByVenue = songsWithPoints.reduce((acc, song) => {
    if (!acc[song.venue_type]) {
      acc[song.venue_type] = [];
    }
    acc[song.venue_type].push(song);
    return acc;
  }, {} as Record<VenueType, SongWithPoints[]>);

  // Sort venue types to ensure final is first, followed by semifinals
  const venueTypes = Object.keys(songsByVenue).sort((a, b) => {
    if (a === "final") return -1;
    if (b === "final") return 1;
    return a.localeCompare(b);
  }) as VenueType[];

  // Sort songs within each venue by total points (descending)
  for (const venueType of venueTypes) {
    songsByVenue[venueType].sort((a, b) => {
      const pointsA = a.totalPoints || 0;
      const pointsB = b.totalPoints || 0;
      return pointsB - pointsA;
    });
  }

  // Prepare data for the voting chart (only for final)
  const finalSongs = songsByVenue["final"] || [];
  const chartCountries = finalSongs.map(song => song.country_name);
  const chartJuryVotes = finalSongs.map(song => song.juryPoints);
  const chartTelevoteVotes = finalSongs.map(song => song.televotePoints);

  return (
    <Container className="py-16 max-w-3xl mx-auto">
      <Flex direction="column" gap="6">
        {/* Breadcrumbs */}
        <Box>
          <Flex gap="2" align="center">
            <Link href="/" className="text-inherit">
              Home
            </Link>
            <Text size="2" color="gray">
              /
            </Text>
            <Text size="2">
              {contest.host_city} {contest.year}
            </Text>
          </Flex>
        </Box>

        {/* Heading */}
        <Heading size="8" className="mb-6">
          {contest.host_city} {contest.year}
        </Heading>

        {/* Error Messages */}
        {(contestError || songsError) && (
          <Card className="p-4 mb-4 bg-red-50">
            <Text size="2" color="red">
              Error loading data: {contestError || songsError}
            </Text>
          </Card>
        )}

        {/* Voting Distribution Chart (only for finals) */}
        {finalSongs.length > 0 && (
          <ChartContainer
            countries={chartCountries}
            juryVotes={chartJuryVotes}
            televoteVotes={chartTelevoteVotes}
          />
        )}

        {/* Display songs by venue */}
        {venueTypes.map((venueType) => (
          <Box key={venueType} className="mb-8">
            {/* Show venue type heading only if we have more than 1 venue */}
            {(venueTypes.length > 1 || venueType !== "final") && (
              <Heading size="5" className="mb-4">
                {formatVenueType(venueType)}
              </Heading>
            )}

            <Flex direction="column" gap="3">
              {songsByVenue[venueType].map((song) => (
                <Card key={song.id} asChild>
                  <Link
                    href={`/contest/${contest.year}/country/${song.country_id}`}
                    className="block no-underline text-inherit"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <Flex align="center" justify="between">
                      <Box>
                        <Flex direction="column" gap="1">
                          <Text size="2" color="gray">
                            {song.country_name}
                          </Text>
                          <Text weight="medium">
                            {song.artist} - {song.title}
                          </Text>
                        </Flex>
                      </Box>
                      <Box>
                        <Flex gap="4" align="center">
                          {/* Points display */}
                          {song.juryPoints !== null &&
                          song.televotePoints !== null ? (
                            // Both jury and televoting points exist, show all three
                            <>
                              <Flex direction="column" align="end">
                                <Text size="1" color="gray">
                                  Jury
                                </Text>
                                <Text weight="medium">{song.juryPoints}</Text>
                              </Flex>
                              <Flex direction="column" align="end">
                                <Text size="1" color="gray">
                                  Televote
                                </Text>
                                <Text weight="medium">
                                  {song.televotePoints}
                                </Text>
                              </Flex>
                              {song.totalPoints !== null && (
                                <Flex direction="column" align="end">
                                  <Text size="1" color="gray">
                                    Total
                                  </Text>
                                  <Text weight="bold">{song.totalPoints}</Text>
                                </Flex>
                              )}
                            </>
                          ) : (
                            // Only one type of points or total only, just show total
                            song.totalPoints !== null && (
                              <Flex direction="column" align="end">
                                <Text size="1" color="gray">
                                  Points
                                </Text>
                                <Text weight="bold">{song.totalPoints}</Text>
                              </Flex>
                            )
                          )}
                        </Flex>
                      </Box>
                    </Flex>
                  </Link>
                </Card>
              ))}
            </Flex>
          </Box>
        ))}
      </Flex>
    </Container>
  );
}
