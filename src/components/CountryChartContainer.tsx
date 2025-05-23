"use client";

import dynamic from "next/dynamic";
import { Box, Card } from "@radix-ui/themes";
import { hasModernVotingSystem } from "@/utils/eurovision";

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
};

export default function CountryChartContainer({
  juryPoints,
  televotePoints,
  totalPoints,
  year,
  height,
}: CountryChartContainerProps) {
  // Determine if this contest uses the modern voting system (jury + televote)
  const usesModernVotingSystem = hasModernVotingSystem(year);

  if (usesModernVotingSystem) {
    // Modern system (2016+): Use jury and televote split if available
    // Ensure values default to 0 if null for countries that didn't receive any points
    const processedJuryPoints = juryPoints !== null ? juryPoints : 0;
    const processedTelevotePoints =
      televotePoints !== null ? televotePoints : 0;

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
    return null; // Don't show any chart if no total points
  }
}
