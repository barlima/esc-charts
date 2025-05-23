"use client";

import { Box, Heading, Flex, Text } from "@radix-ui/themes";
import { isSingleVotingSystem } from "@/utils/eurovision";

type Vote = {
  points: number;
  toCountryName: string;
  artist: string;
  title: string;
};

type VotingListProps = {
  votes: Vote[];
  title: string;
  type: "jury" | "televote";
  year?: number;
};

// Eurovision point system: 12, 10, 8, 7, 6, 5, 4, 3, 2, 1
const EUROVISION_POINTS = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];

export default function VotingList({ votes, title, type, year }: VotingListProps) {
  // Create a map for quick lookup
  const voteMap = new Map<number, Vote>();
  votes.forEach((vote) => {
    voteMap.set(vote.points, vote);
  });

  // Determine color - use blue for single voting systems to match chart
  const isSingleSystem = year ? isSingleVotingSystem(year) : false;
  const color = isSingleSystem ? "blue" : (type === "jury" ? "blue" : "orange");

  return (
    <Box>
      <Heading size="3" mb="3" color={color}>
        {title}
      </Heading>
      
      <Flex direction="column" gap="2">
        {EUROVISION_POINTS.map((points) => {
          const vote = voteMap.get(points);
          
          return (
            <Flex
              key={points}
              align="center"
              gap="3"
              className="min-h-[48px] p-2 border-b border-gray-200"
            >
              <Text
                size="5"
                weight="bold"
                className="w-8 text-center"
                color={color}
              >
                {points}
              </Text>
              
              {vote ? (
                <Flex direction="column" gap="1" className="flex-1">
                  <Text size="3" weight="medium">
                    {vote.toCountryName}
                  </Text>
                  <Text size="2" color="gray">
                    {vote.artist} - {vote.title}
                  </Text>
                </Flex>
              ) : (
                <Flex direction="column" gap="1" className="flex-1">
                  <Text size="3" color="gray" style={{ fontStyle: "italic" }}>
                    No vote given
                  </Text>
                </Flex>
              )}
            </Flex>
          );
        })}
      </Flex>
    </Box>
  );
} 