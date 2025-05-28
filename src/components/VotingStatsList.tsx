import { Box, Text, Flex, Card } from "@radix-ui/themes";

type VotingStatsItem = {
  countryId: number;
  countryName: string;
  totalPoints: number;
};

type VotingStatsListProps = {
  data: VotingStatsItem[];
  title: string;
  maxItems?: number;
};

export default function VotingStatsList({ 
  data, 
  title, 
  maxItems = 10 
}: VotingStatsListProps) {
  const topItems = data.slice(0, maxItems);

  if (topItems.length === 0) {
    return (
      <Card className="p-6">
        <Text size="3" weight="bold" mb="3">
          {title}
        </Text>
        <Text size="2" color="gray">
          No voting data available.
        </Text>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <Text size="3" weight="bold" mb="4">
        {title}
      </Text>
      <Flex direction="column" gap="2">
        {topItems.map((item, index) => (
          <Flex key={item.countryId} justify="between" align="center" className="py-2">
            <Flex align="center" gap="3">
              <Box className="w-6 text-center">
                <Text size="2" weight="bold" color="gray">
                  {index + 1}
                </Text>
              </Box>
              <Text size="2" weight="medium">
                {item.countryName}
              </Text>
            </Flex>
            <Text size="2" weight="bold">
              {item.totalPoints} pts
            </Text>
          </Flex>
        ))}
      </Flex>
    </Card>
  );
} 