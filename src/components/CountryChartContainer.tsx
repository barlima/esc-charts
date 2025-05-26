"use client";

import dynamic from "next/dynamic";
import { Box, Card } from "@radix-ui/themes";
import { hasModernVotingSystem, shouldShowSeparateVotes } from "@/utils/eurovision";

// Dynamic import for the chart component
const CountryPointsChart = dynamic(
  () => import("@/components/CountryPointsChart"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: "300px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Loading chart...
      </div>
    ),
  }
);

type CountryChartContainerProps = {
  juryPoints: number | null;
  televotePoints: number | null;
  totalPoints: number | null;
  height?: string;
  year: number; // Add contest year to determine voting system
  venueType?: "final" | "semifinal1" | "semifinal2"; // Add venue type for 2023+ rule
};

export default function CountryChartContainer({
  juryPoints,
  televotePoints,
  totalPoints,
  year,
  height,
  venueType,
}: CountryChartContainerProps) {
  // Determine if this contest uses the modern voting system (jury + televote)
  const usesModernVotingSystem = hasModernVotingSystem(year);
  
  // Check if we should show separate votes (which means we have both jury and televote)
  const showSeparateVotes = shouldShowSeparateVotes(year, venueType);

  // Only show the pie chart if:
  // 1. It's a modern voting system (2016+)
  // 2. We should show separate votes (not a single voting system)
  // 3. We have both jury and televote points (not just one type)
  const shouldShowChart = usesModernVotingSystem && 
                         showSeparateVotes && 
                         juryPoints !== null && 
                         televotePoints !== null &&
                         (juryPoints > 0 || televotePoints > 0);

  if (shouldShowChart) {
    // Modern system with both voting types: Use jury and televote split
    const processedJuryPoints = juryPoints !== null ? juryPoints : 0;
    const processedTelevotePoints = televotePoints !== null ? televotePoints : 0;

    return (
      <Card className="p-6" mb="4">
        <Box mt="6">
          <CountryPointsChart
            height={height}
            juryPoints={processedJuryPoints}
            televotePoints={processedTelevotePoints}
            totalPoints={totalPoints}
          />
        </Box>
      </Card>
    );
  } else {
    return null; // Don't show chart for single voting systems or when no points
  }
}
