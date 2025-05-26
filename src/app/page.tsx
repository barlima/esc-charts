import {
  Container,
  Heading,
  Text,
  Box,
  Flex,
  Card,
  Grid,
} from "@radix-ui/themes";
import {
  getContests,
  getCountries,
  getContestDataCompleteness,
} from "./actions";
import Link from "next/link";

export default async function Home() {
  // Fetch contests and countries using the server actions
  const { contests, errorMessage: contestsError } = await getContests();
  const { countries, errorMessage: countriesError } = await getCountries();

  // Fetch completeness data for each contest
  const contestsWithCompleteness = await Promise.all(
    contests.map(async (contest) => {
      const { completenessPercentage, songCompleteness, voteCompleteness } =
        await getContestDataCompleteness(contest.id);
      return {
        ...contest,
        completenessPercentage,
        songCompleteness,
        voteCompleteness,
      };
    })
  );

  return (
    <Container className="py-16 max-w-3xl mx-auto">
      <Flex direction="column" gap="6">
        <Box className="text-center mb-8">
          <Heading size="8" style={{ marginBottom: "1.5rem" }}>
            Eurovision Song Contest Charts
          </Heading>
          <Text size="3" color="gray">
            Explore voting and performance statistics from Eurovision Song
            Contests throughout the years
          </Text>
        </Box>

        {/* Data Completeness Notice */}
        <Card
          className="p-4 mb-6"
          style={{ backgroundColor: "#fef3c7", borderColor: "#f59e0b" }}
        >
          <Flex align="center" gap="3">
            <Box style={{ fontSize: "20px" }}>⚠️</Box>
            <Box>
              <Text size="3" weight="medium" style={{ color: "#92400e" }}>
                Data in Progress
              </Text>
              <br />
              <Text size="2" style={{ color: "#92400e", marginTop: "4px" }}>
                Please note that the data may not be complete or entirely
                accurate in some cases. This application is currently in
                development, and we&apos;re working to achieve 100% data
                completeness.
              </Text>
            </Box>
          </Flex>
        </Card>

        {/* Contests Section */}
        <Box>
          <Heading size="6" style={{ marginBottom: "1.5rem" }}>
            Eurovision Song Contests
          </Heading>

          {contestsError && (
            <Card className="p-4 mb-4 bg-red-50">
              <Text size="2" color="red">
                Error loading contests: {contestsError}
              </Text>
            </Card>
          )}

          {contests.length === 0 && !contestsError && (
            <Card className="p-4 mb-4">
              <Text size="2" color="gray">
                No contests found. Please make sure your database is set up
                correctly.
              </Text>
            </Card>
          )}

          <Grid
            columns={{ initial: "1", sm: "2", md: "3" }}
            gap="4"
            className="mb-8"
          >
            {contestsWithCompleteness.map((contest) => {
              const getCompletenessColor = (percentage: number) => {
                if (percentage === 0) return "#ef4444"; // red
                if (percentage < 25) return "#ef4444"; // red
                if (percentage < 100) return "#eab308"; // yellow
                return "#22c55e"; // green
              };

              return (
                <Card
                  key={contest.id}
                  asChild
                  className="hover:shadow-lg transition-shadow"
                >
                  <Link
                    href={`/contest/${contest.year}`}
                    className="block p-4 no-underline hover:cursor-pointer text-inherit"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <Flex direction="column" gap="2">
                      <Text size="5" weight="bold">
                        {contest.year}
                      </Text>
                      <Text size="3" color="gray">
                        {contest.host_city}
                      </Text>
                      <Flex direction="column" gap="1" mt="1">
                        <Flex align="center" gap="2">
                          <Box
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor: getCompletenessColor(
                                contest.songCompleteness
                              ),
                            }}
                          />
                          <Text size="2" color="gray">
                            {contest.songCompleteness}% songs
                          </Text>
                        </Flex>
                        <Flex align="center" gap="2">
                          <Box
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor: getCompletenessColor(
                                contest.voteCompleteness
                              ),
                            }}
                          />
                          <Text size="2" color="gray">
                            {contest.voteCompleteness}% votes
                          </Text>
                        </Flex>
                      </Flex>
                    </Flex>
                  </Link>
                </Card>
              );
            })}
          </Grid>
        </Box>

        {/* Countries Section */}
        <Box>
          <Heading size="6" style={{ marginBottom: "1.5rem" }}>
            Countries
          </Heading>

          {countriesError && (
            <Card className="p-4 mb-4 bg-red-50">
              <Text size="2" color="red">
                Error loading countries: {countriesError}
              </Text>
            </Card>
          )}

          {countries.length === 0 && !countriesError && (
            <Card className="p-4 mb-4">
              <Text size="2" color="gray">
                No countries found. Please make sure your database is set up
                correctly.
              </Text>
            </Card>
          )}

          <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="2">
            {countries.map((country) => (
              <Card
                key={country.id}
                asChild
                className="hover:opacity-80 transition-opacity"
              >
                <Link
                  href={`/country/${country.id}`}
                  className="block p-3 no-underline text-inherit"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <Text size="3">{country.name}</Text>
                </Link>
              </Card>
            ))}
          </Grid>
        </Box>

        {/* Footer */}
        <Box className="mt-16 pt-8 border-t border-gray-300">
          <Text size="2" color="gray" className="text-center">
            Created by{" "}
            <Link
              href="https://www.perucki.be"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Bartłomiej Perucki
            </Link>
          </Text>
        </Box>
      </Flex>
    </Container>
  );
}
