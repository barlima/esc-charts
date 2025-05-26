import {
  Container,
  Heading,
  Text,
  Box,
  Flex,
  Card,
  Grid,
  Badge,
} from "@radix-ui/themes";
import {
  getContestByYear,
  getVotesBySong,
  getSongPosition,
  getVotesReceivedByCountry,
  getParticipatingCountries,
  getVotesGivenByCountry,
} from "@/app/actions";
import { notFound } from "next/navigation";
import { supabase } from "@/utils/supabase";
import Link from "next/link";
import CountryChartContainer from "@/components/CountryChartContainer";
import CountryVotesChartContainer from "@/components/CountryVotesChartContainer";
import VotingList from "@/components/VotingList";
import { shouldShowSeparateVotes, hasJuryVotes } from "@/utils/eurovision";

type VenueType = "final" | "semifinal1" | "semifinal2";

export default async function SongPage({
  params,
}: {
  params: Promise<{ year: string; id: string }>;
}) {
  const { year: contestYear, id: countryId } = await params;
  const year = parseInt(contestYear, 10);
  const countryIdNum = parseInt(countryId, 10);

  if (isNaN(year) || isNaN(countryIdNum)) {
    notFound();
  }

  // Fetch contest data
  const { contest, errorMessage: contestError } = await getContestByYear(year);

  if (!contest) {
    notFound();
  }

  // Fetch country data
  const { data: countryData, error: countryError } = await supabase
    .from("countries")
    .select("*")
    .eq("id", countryIdNum)
    .single();

  if (countryError || !countryData) {
    notFound();
  }

  // Fetch song data - first try to get the final performance
  const { data: finalSongData, error: finalSongError } = await supabase
    .from("songs")
    .select("*")
    .eq("contest_id", contest.id)
    .eq("country_id", countryIdNum)
    .eq("venue_type", "final")
    .single();

  // If no final performance, try to get the semifinal performance
  let song = finalSongData;
  let songError = null;

  if (finalSongError) {
    const { data: semifinalSongData, error: semifinalSongError } =
      await supabase
        .from("songs")
        .select("*")
        .eq("contest_id", contest.id)
        .eq("country_id", countryIdNum)
        .or("venue_type.eq.semifinal1,venue_type.eq.semifinal2")
        .single();

    if (semifinalSongError) {
      songError = semifinalSongError.message;
    } else {
      song = semifinalSongData;
    }
  }

  if (!song) {
    notFound();
  }

  // Get votes/points for the song
  const {
    juryPoints: finalJuryPoints,
    televotePoints: finalTelevotePoints,
    totalPoints: finalTotalPoints,
  } = await getVotesBySong(song.id);

  // Get position in final
  const { position: finalPosition } =
    song.venue_type === "final"
      ? await getSongPosition(song.id, "final")
      : { position: null };

  // Get all countries participating in the final
  let finalCountries: Array<{ id: number; name: string }> = [];
  let finalCountriesError: string | null = null;
  if (contest) {
    const result = await getParticipatingCountries(contest.id, "final");
    finalCountries = result.countries;
    finalCountriesError = result.errorMessage;
  }

  // Get votes received from each country for the final
  const { votes: finalVotes, errorMessage: finalVotesError } =
    song.venue_type === "final"
      ? await getVotesReceivedByCountry(song.id)
      : { votes: [], errorMessage: null };

  // Get votes given by this country in the final
  const { votes: finalVotesGiven, errorMessage: finalVotesGivenError } =
    await getVotesGivenByCountry(countryIdNum, contest.id, "final");

  // Find if this country had a semifinal performance
  let semifinalSong = null;
  let semifinalJuryPoints = null;
  let semifinalTelevotePoints = null;
  let semifinalTotalPoints = null;
  let semifinalPosition = null;
  let semifinalVenueType = null;

  if (song.venue_type === "final") {
    // This is a final performance, check if there was a semifinal performance
    const { data: semifinalData } = await supabase
      .from("songs")
      .select("*")
      .eq("contest_id", contest.id)
      .eq("country_id", countryIdNum)
      .or("venue_type.eq.semifinal1,venue_type.eq.semifinal2")
      .single();

    if (semifinalData) {
      semifinalSong = semifinalData;
      semifinalVenueType = semifinalData.venue_type as VenueType;

      const semifinalPoints = await getVotesBySong(semifinalData.id);
      semifinalJuryPoints = semifinalPoints.juryPoints;
      semifinalTelevotePoints = semifinalPoints.televotePoints;
      semifinalTotalPoints = semifinalPoints.totalPoints;

      const { position } = await getSongPosition(
        semifinalData.id,
        semifinalData.venue_type as VenueType
      );
      semifinalPosition = position;
    }
  }

  // Check if the song qualified to the final
  const qualified = song.qualified === true;

  // Get votes received from each country for the semifinal
  let semifinalVotes: Array<{
    fromCountryName: string;
    juryPoints: number | null;
    televotePoints: number | null;
  }> = [];
  let semifinalVotesError: string | null = null;

  if (semifinalSong) {
    const result = await getVotesReceivedByCountry(semifinalSong.id);
    semifinalVotes = result.votes;
    semifinalVotesError = result.errorMessage;
  } else if (song.venue_type !== "final") {
    // For countries that didn't qualify, the main song IS the semifinal performance
    const result = await getVotesReceivedByCountry(song.id);
    semifinalVotes = result.votes;
    semifinalVotesError = result.errorMessage;
  }

  // Get votes given by this country in the semifinal
  let semifinalVotesGiven: Array<{
    points: number;
    toCountryName: string;
    artist: string;
    title: string;
    voteType: "jury" | "televote";
  }> = [];
  let semifinalVotesGivenError: string | null = null;

  // For countries that participated in semifinals
  if (semifinalVenueType) {
    const result = await getVotesGivenByCountry(
      countryIdNum,
      contest.id,
      semifinalVenueType
    );
    semifinalVotesGiven = result.votes;
    semifinalVotesGivenError = result.errorMessage;
  } else if (song.venue_type !== "final") {
    // For countries that didn't qualify, get their votes from the semifinal they participated in
    const result = await getVotesGivenByCountry(
      countryIdNum,
      contest.id,
      song.venue_type as VenueType
    );
    semifinalVotesGiven = result.votes;
    semifinalVotesGivenError = result.errorMessage;
  }

  // For Big 5 + Host countries that didn't participate in semifinals but still voted
  let semifinal1VotesGiven: Array<{
    points: number;
    toCountryName: string;
    artist: string;
    title: string;
    voteType: "jury" | "televote";
  }> = [];
  let semifinal2VotesGiven: Array<{
    points: number;
    toCountryName: string;
    artist: string;
    title: string;
    voteType: "jury" | "televote";
  }> = [];
  let semifinal1VotesGivenError: string | null = null;
  let semifinal2VotesGivenError: string | null = null;

  // If this country didn't participate in semifinals but is in the final, check for semifinal votes
  if (!semifinalSong && song.venue_type === "final") {
    // Check for semifinal 1 votes
    const sf1Result = await getVotesGivenByCountry(
      countryIdNum,
      contest.id,
      "semifinal1"
    );
    semifinal1VotesGiven = sf1Result.votes;
    semifinal1VotesGivenError = sf1Result.errorMessage;

    // Check for semifinal 2 votes
    const sf2Result = await getVotesGivenByCountry(
      countryIdNum,
      contest.id,
      "semifinal2"
    );
    semifinal2VotesGiven = sf2Result.votes;
    semifinal2VotesGivenError = sf2Result.errorMessage;
  }

  // Get all participating countries in the semifinal (if applicable)
  let semifinalCountries: Array<{ id: number; name: string }> = [];
  let semifinalCountriesError: string | null = null;

  if (contest && (semifinalVenueType || (song.venue_type !== "final"))) {
    const venueForCountries = semifinalVenueType || song.venue_type;
    const result = await getParticipatingCountries(
      contest.id,
      venueForCountries as VenueType
    );
    semifinalCountries = result.countries;
    semifinalCountriesError = result.errorMessage;
  }

  // Create comprehensive votes including all countries
  const enrichedFinalVotes = [...finalVotes];

  // Add any missing countries (with zero votes)
  finalCountries.forEach((country) => {
    // Check if this country is already in our votes
    const exists = enrichedFinalVotes.some(
      (vote) =>
        vote.fromCountryName.toLowerCase() === country.name.toLowerCase()
    );

    if (!exists) {
      enrichedFinalVotes.push({
        fromCountryName: country.name,
        juryPoints: 0,
        televotePoints: 0,
      });
    }
  });

  // Same for semifinal
  const enrichedSemifinalVotes = [...semifinalVotes];

  // Add any missing countries (with zero votes) - only if we have semifinal countries
  if (semifinalCountries.length > 0) {
    semifinalCountries.forEach((country) => {
      const exists = enrichedSemifinalVotes.some(
        (vote) =>
          vote.fromCountryName.toLowerCase() === country.name.toLowerCase()
      );

      if (!exists) {
        enrichedSemifinalVotes.push({
          fromCountryName: country.name,
          juryPoints: 0,
          televotePoints: 0,
        });
      }
    });
  }

  return (
    <Container className="py-16 max-w-3xl mx-auto">
      <Flex direction="column" gap="6">
        {/* Breadcrumbs */}
        <Box>
          <Flex gap="2" align="center">
            <Link
              href="/"
              className="text-gray-500 text-sm no-underline hover:underline"
            >
              Home
            </Link>
            <Text size="2" color="gray">
              /
            </Text>
            <Link
              href={`/contest/${contest.year}`}
              className="text-gray-500 text-sm no-underline hover:underline"
            >
              {contest.host_city} {contest.year}
            </Link>
            <Text size="2" color="gray">
              /
            </Text>
            <Text size="2">{countryData.name}</Text>
          </Flex>
        </Box>

        {/* Country name heading */}
        <Flex justify="between" align="center">
          <Heading size="8">{countryData.name}</Heading>
          <Link
            href={`/country/${countryIdNum}`}
            className="text-blue-500 text-sm no-underline hover:underline"
          >
            {countryData.name} ESC history
          </Link>
        </Flex>

        {/* Artist and song subheading */}
        <Heading size="5" as="h2" color="gray">
          {song.artist} - {song.title}
        </Heading>

        {/* Error Messages */}
        {(contestError ||
          songError ||
          finalVotesError ||
          finalVotesGivenError ||
          semifinalVotesError ||
          semifinalVotesGivenError ||
          semifinal1VotesGivenError ||
          semifinal2VotesGivenError ||
          finalCountriesError ||
          semifinalCountriesError) && (
          <Card className="p-4 mb-4 bg-red-50">
            <Text size="2" color="red">
              Error loading data:{" "}
              {contestError ||
                songError ||
                finalVotesError ||
                finalVotesGivenError ||
                semifinalVotesError ||
                semifinalVotesGivenError ||
                semifinal1VotesGivenError ||
                semifinal2VotesGivenError ||
                finalCountriesError ||
                semifinalCountriesError}
            </Text>
          </Card>
        )}

        {/* Final Results Section */}
        <section id="final">
          <Heading size="4" mb="3">
            Final Results
            {!qualified && song.venue_type !== "final" && (
              <Badge color="amber" ml="2">
                Did not qualify
              </Badge>
            )}
          </Heading>

          {/* Final KPIs */}
          <Card className="p-6" mb="4">
            <Grid columns="4" gap="6">
              <Flex direction="column" align="center" gap="1">
                <Text size="2" color="gray">
                  Position
                </Text>
                <Heading size="6">{finalPosition || "N/A"}</Heading>
              </Flex>

              <Flex direction="column" align="center" gap="1">
                <Text size="2" color="gray">
                  Jury Points
                </Text>
                <Heading size="6">
                  {finalJuryPoints !== null ? finalJuryPoints : "N/A"}
                </Heading>
              </Flex>

              <Flex direction="column" align="center" gap="1">
                <Text size="2" color="gray">
                  Televote
                </Text>
                <Heading size="6">
                  {finalTelevotePoints !== null ? finalTelevotePoints : "N/A"}
                </Heading>
              </Flex>

              <Flex direction="column" align="center" gap="1">
                <Text size="2" color="gray">
                  Total Points
                </Text>
                <Heading size="6">
                  {finalTotalPoints !== null ? finalTotalPoints : "N/A"}
                </Heading>
              </Flex>
            </Grid>
          </Card>

          {/* Final Points Chart - only show if country actually participated in final */}
          {song.venue_type === "final" && (finalJuryPoints !== null ||
            finalTelevotePoints !== null ||
            finalTotalPoints !== null) && (
            <CountryChartContainer
              juryPoints={finalJuryPoints}
              televotePoints={finalTelevotePoints}
              totalPoints={finalTotalPoints}
              year={year}
              venueType="final"
            />
          )}

          {/* Votes from other countries for Final */}
          {song.venue_type === "final" && (
            <Card className="p-6" mb="4">
              <CountryVotesChartContainer
                votes={enrichedFinalVotes}
                title="Votes Received from Other Countries (Final)"
                height={finalCountries.length * 50 + "px"}
                year={year}
              />
            </Card>
          )}

          {/* Votes given by this country in Final */}
          {finalVotesGiven.length > 0 && (
            <Card className="p-6" mb="4">
              <Heading size="3" mb="4">
                How {countryData.name} Voted (Final)
              </Heading>
              {shouldShowSeparateVotes(year) ? (
                <Grid columns="2" gap="6">
                  {/* Jury votes */}
                  <VotingList
                    votes={finalVotesGiven.filter(
                      (vote) => vote.voteType === "jury"
                    )}
                    title="Jury Votes"
                    type="jury"
                    year={year}
                    contestYear={year}
                  />
                  {/* Televotes */}
                  <VotingList
                    votes={finalVotesGiven.filter(
                      (vote) => vote.voteType === "televote"
                    )}
                    title="Televotes"
                    type="televote"
                    year={year}
                    contestYear={year}
                  />
                </Grid>
              ) : (
                <Grid columns="1" gap="6">
                  {/* Combined votes for older contests */}
                  <VotingList
                    votes={finalVotesGiven}
                    title="Votes"
                    type="televote"
                    year={year}
                    contestYear={year}
                  />
                </Grid>
              )}
            </Card>
          )}
        </section>

        {/* Semifinal Results Section */}
        {(semifinalSong || (song.venue_type !== "final" && !qualified)) && (
          <section
            id={
              semifinalVenueType === "semifinal1" ? "semifinal1" : "semifinal2"
            }
          >
            <Heading size="4" mb="3">
              {semifinalVenueType === "semifinal1"
                ? "Semi-Final 1"
                : "Semi-Final 2"}{" "}
              Results
            </Heading>

            {/* Semifinal KPIs */}
            <Card className="p-6" mb="4">
              <Grid columns={(semifinalVenueType || song.venue_type) && hasJuryVotes(year, (semifinalVenueType || song.venue_type) as VenueType) ? "4" : "3"} gap="6">
                <Flex direction="column" align="center" gap="1">
                  <Text size="2" color="gray">
                    Position
                  </Text>
                  <Heading size="6">{semifinalPosition || finalPosition || "N/A"}</Heading>
                </Flex>

                {(semifinalVenueType || song.venue_type) && hasJuryVotes(year, (semifinalVenueType || song.venue_type) as VenueType) && (
                  <Flex direction="column" align="center" gap="1">
                    <Text size="2" color="gray">
                      Jury Points
                    </Text>
                    <Heading size="6">
                      {(semifinalJuryPoints !== null ? semifinalJuryPoints : finalJuryPoints) !== null ? (semifinalJuryPoints !== null ? semifinalJuryPoints : finalJuryPoints) : "N/A"}
                    </Heading>
                  </Flex>
                )}

                <Flex direction="column" align="center" gap="1">
                  <Text size="2" color="gray">
                    Televote
                  </Text>
                  <Heading size="6">
                    {(semifinalTelevotePoints !== null ? semifinalTelevotePoints : finalTelevotePoints) !== null
                      ? (semifinalTelevotePoints !== null ? semifinalTelevotePoints : finalTelevotePoints)
                      : "N/A"}
                  </Heading>
                </Flex>

                <Flex direction="column" align="center" gap="1">
                  <Text size="2" color="gray">
                    Total Points
                  </Text>
                  <Heading size="6">
                    {(semifinalTotalPoints !== null ? semifinalTotalPoints : finalTotalPoints) !== null
                      ? (semifinalTotalPoints !== null ? semifinalTotalPoints : finalTotalPoints)
                      : "N/A"}
                  </Heading>
                </Flex>
              </Grid>
            </Card>

            {/* Semifinal Points Chart */}
            {((semifinalJuryPoints !== null ? semifinalJuryPoints : finalJuryPoints) !== null ||
              (semifinalTelevotePoints !== null ? semifinalTelevotePoints : finalTelevotePoints) !== null ||
              (semifinalTotalPoints !== null ? semifinalTotalPoints : finalTotalPoints) !== null) && (
              <CountryChartContainer
                juryPoints={semifinalJuryPoints !== null ? semifinalJuryPoints : finalJuryPoints}
                televotePoints={semifinalTelevotePoints !== null ? semifinalTelevotePoints : finalTelevotePoints}
                totalPoints={semifinalTotalPoints !== null ? semifinalTotalPoints : finalTotalPoints}
                year={year}
                venueType={(semifinalVenueType || song.venue_type) as VenueType}
              />
            )}

            {/* Votes from other countries for Semifinal */}
            <Card className="p-6" mb="4">
              <CountryVotesChartContainer
                votes={enrichedSemifinalVotes}
                title={`Votes Received from Other Countries (${
                  (semifinalVenueType || song.venue_type) === "semifinal1"
                    ? "Semi-Final 1"
                    : "Semi-Final 2"
                })`}
                height={semifinalCountries.length * 50 + "px"}
                year={year}
              />
            </Card>

            {/* Votes given by this country in Semifinal */}
            {(semifinalSong ? semifinalVotesGiven : finalVotesGiven).length > 0 && (
              <Card className="p-6" mb="4">
                <Heading size="3" mb="4">
                  How {countryData.name} Voted (
                  {(semifinalVenueType || song.venue_type) === "semifinal1"
                    ? "Semi-Final 1"
                    : "Semi-Final 2"}
                  )
                </Heading>
                {shouldShowSeparateVotes(year, (semifinalVenueType || song.venue_type) as VenueType) ? (
                  <Grid columns={(semifinalVenueType || song.venue_type) && hasJuryVotes(year, (semifinalVenueType || song.venue_type) as VenueType) ? "2" : "1"} gap="6">
                    {/* Jury votes - only show if jury votes exist for this venue/year */}
                    {(semifinalVenueType || song.venue_type) && hasJuryVotes(year, (semifinalVenueType || song.venue_type) as VenueType) && (
                      <VotingList
                        votes={(semifinalSong ? semifinalVotesGiven : finalVotesGiven).filter(
                          (vote) => vote.voteType === "jury"
                        )}
                        title="Jury Votes"
                        type="jury"
                        year={year}
                        contestYear={year}
                      />
                    )}
                    {/* Televotes */}
                    <VotingList
                      votes={(semifinalSong ? semifinalVotesGiven : finalVotesGiven).filter(
                        (vote) => vote.voteType === "televote"
                      )}
                      title="Televotes"
                      type="televote"
                      year={year}
                      contestYear={year}
                    />
                  </Grid>
                ) : (
                  <Grid columns="1" gap="6">
                    {/* Combined votes for older contests */}
                    <VotingList
                      votes={semifinalSong ? semifinalVotesGiven : finalVotesGiven}
                      title="Votes"
                      type="televote"
                      year={year}
                      contestYear={year}
                    />
                  </Grid>
                )}
              </Card>
            )}
          </section>
        )}

        {/* Semifinal Voting Sections for Big 5 + Host countries */}
        {!semifinalSong && song.venue_type === "final" && (semifinal1VotesGiven.length > 0 || semifinal2VotesGiven.length > 0) && (
          <>
            {/* Semifinal 1 Voting */}
            {semifinal1VotesGiven.length > 0 && (
              <section id="semifinal1">
                <Heading size="4" mb="3">
                  Semi-Final 1 Voting
                </Heading>

                <Card className="p-6" mb="4">
                  <Heading size="3" mb="4">
                    How {countryData.name} Voted (Semi-Final 1)
                  </Heading>
                  {shouldShowSeparateVotes(year, "semifinal1") ? (
                    <Grid columns={hasJuryVotes(year, "semifinal1") ? "2" : "1"} gap="6">
                      {/* Jury votes - only show if jury votes exist for this venue/year */}
                      {hasJuryVotes(year, "semifinal1") && (
                        <VotingList
                          votes={semifinal1VotesGiven.filter(
                            (vote) => vote.voteType === "jury"
                          )}
                          title="Jury Votes"
                          type="jury"
                          year={year}
                          contestYear={year}
                        />
                      )}
                      {/* Televotes */}
                      <VotingList
                        votes={semifinal1VotesGiven.filter(
                          (vote) => vote.voteType === "televote"
                        )}
                        title="Televotes"
                        type="televote"
                        year={year}
                        contestYear={year}
                      />
                    </Grid>
                  ) : (
                    <Grid columns="1" gap="6">
                      {/* Combined votes for older contests */}
                      <VotingList
                        votes={semifinal1VotesGiven}
                        title="Votes"
                        type="televote"
                        year={year}
                        contestYear={year}
                      />
                    </Grid>
                  )}
                </Card>
              </section>
            )}

            {/* Semifinal 2 Voting */}
            {semifinal2VotesGiven.length > 0 && (
              <section id="semifinal2">
                <Heading size="4" mb="3">
                  Semi-Final 2 Voting
                </Heading>

                <Card className="p-6" mb="4">
                  <Heading size="3" mb="4">
                    How {countryData.name} Voted (Semi-Final 2)
                  </Heading>
                  {shouldShowSeparateVotes(year, "semifinal2") ? (
                    <Grid columns={hasJuryVotes(year, "semifinal2") ? "2" : "1"} gap="6">
                      {/* Jury votes - only show if jury votes exist for this venue/year */}
                      {hasJuryVotes(year, "semifinal2") && (
                        <VotingList
                          votes={semifinal2VotesGiven.filter(
                            (vote) => vote.voteType === "jury"
                          )}
                          title="Jury Votes"
                          type="jury"
                          year={year}
                          contestYear={year}
                        />
                      )}
                      {/* Televotes */}
                      <VotingList
                        votes={semifinal2VotesGiven.filter(
                          (vote) => vote.voteType === "televote"
                        )}
                        title="Televotes"
                        type="televote"
                        year={year}
                        contestYear={year}
                      />
                    </Grid>
                  ) : (
                    <Grid columns="1" gap="6">
                      {/* Combined votes for older contests */}
                      <VotingList
                        votes={semifinal2VotesGiven}
                        title="Votes"
                        type="televote"
                        year={year}
                        contestYear={year}
                      />
                    </Grid>
                  )}
                </Card>
              </section>
            )}
          </>
        )}
      </Flex>
    </Container>
  );
}
