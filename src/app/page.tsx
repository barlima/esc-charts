import { Container, Heading, Text, Box, Flex, Card } from "@radix-ui/themes";
import { getContests } from "./actions";
import Link from "next/link";

export default async function Home() {
  // Fetch contests using the server action
  const { contests, errorMessage } = await getContests();

  return (
    <Container className="py-16 max-w-3xl mx-auto">
      <Flex direction="column" gap="6">
        <Box className="text-center mb-8">
          <Heading size="8" className="mb-3">
            Eurovision Song Contest Charts
          </Heading>
          <Text size="3" color="gray">
            Explore voting and performance statistics from Eurovision Song
            Contests throughout the years
          </Text>
        </Box>

        {errorMessage && (
          <Card className="p-4 mb-4 bg-red-50">
            <Text size="2" color="red">
              Error loading contests: {errorMessage}
            </Text>
          </Card>
        )}

        {contests.length === 0 && !errorMessage && (
          <Card className="p-4 mb-4">
            <Text size="2" color="gray">
              No contests found. Please make sure your database is set up
              correctly.
            </Text>
          </Card>
        )}

        <Flex direction="column" gap="3">
          {contests.map((contest) => (
            <Card key={contest.id} asChild>
              <Link
                href={`/contest/${contest.year}`}
                className="block p-4 no-underline hover:cursor-pointer text-inherit"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <Flex align="center" justify="between">
                  <Text size="4" weight="medium">
                    {contest.host_city} {contest.year}
                  </Text>
                  <Box>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 15 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z"
                        fill="currentColor"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </Box>
                </Flex>
              </Link>
            </Card>
          ))}
        </Flex>
      </Flex>
    </Container>
  );
}
