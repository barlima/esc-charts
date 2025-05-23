"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { CHART_COLORS } from "@/utils/constants";
import { isSingleVotingSystem, getPrimaryVotingType } from "@/utils/eurovision";

type CountryVotesChartProps = {
  countryVotes: {
    fromCountryName: string;
    juryPoints: number | null;
    televotePoints: number | null;
  }[];
  height?: string;
  year?: number;
};

export default function CountryVotesChart({
  countryVotes,
  height = "1000px",
  year,
}: CountryVotesChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || !countryVotes.length) return;

    // Use the color palette from constants
    const colorPalette = CHART_COLORS;

    const chart = echarts.init(chartRef.current);

    // Check if we have both jury and televote data
    const hasJuryData = countryVotes.some((v) => v.juryPoints !== null && v.juryPoints > 0);
    const hasTelevoteData = countryVotes.some((v) => v.televotePoints !== null && v.televotePoints > 0);
    const hasBothTypes = hasJuryData && hasTelevoteData;

    // For historical contests, determine which voting system was actually used
    let showAsHybrid = hasBothTypes;
    let primaryVotingType: 'jury' | 'televote' | null = null;

    if (year && isSingleVotingSystem(year)) {
      showAsHybrid = false;
      primaryVotingType = getPrimaryVotingType(year);
      
      // For single voting systems, use the data that actually exists
      if (!hasJuryData && hasTelevoteData) {
        primaryVotingType = 'televote';
      } else if (hasJuryData && !hasTelevoteData) {
        primaryVotingType = 'jury';
      }
    }

    // Add totalPoints field and sort by it (ascending for y-axis), 
    // then reverse alphabetically as secondary sort
    const sortedData = countryVotes
      .map((vote) => ({
        ...vote,
        totalPoints:
          (vote.juryPoints !== null ? vote.juryPoints : 0) +
          (vote.televotePoints !== null ? vote.televotePoints : 0),
      }))
      .sort((a, b) => {
        // First sort by total points
        if (a.totalPoints !== b.totalPoints) {
          return a.totalPoints - b.totalPoints;
        }
        // Then sort reverse alphabetically (Z to A)
        return b.fromCountryName.localeCompare(a.fromCountryName);
      });

    // Extract sorted data
    const sortedCountries = sortedData.map((d) => d.fromCountryName);
    const sortedJuryVotes = sortedData.map((d) => d.juryPoints);
    const sortedTelevoteVotes = sortedData.map((d) => d.televotePoints);

    // Fixed bar width of 20px
    const barWidth = 20;

    if (showAsHybrid) {
      // Create pyramid chart (bar chart with negative values on left side)
      chart.setOption({
        // Set the global color palette
        color: colorPalette,
        legend: {
          data: ["Jury", "Televote"],
          bottom: 10,
          textStyle: {
            color: "#ffffff",
          },
        },
        grid: {
          left: "5%",
          right: "5%",
          top: "20",
          bottom: "10%",
          containLabel: true,
        },
        // Remove tooltip
        tooltip: {
          show: false,
        },
        xAxis: {
          type: "value",
          axisLabel: {
            formatter: function (value: number) {
              return Math.abs(value).toString();
            },
          },
          // Hide grid lines
          splitLine: {
            show: false,
          },
        },
        yAxis: {
          type: "category",
          data: sortedCountries,
          axisTick: {
            alignWithLabel: true,
          },
          // Increase space between countries
          axisLabel: {
            margin: 15,
          },
          // Hide grid lines
          splitLine: {
            show: false,
          },
        },
        series: [
          {
            name: "Jury",
            type: "bar",
            stack: "Total",
            barWidth: barWidth,
            barGap: "10%",
            itemStyle: {
              borderRadius: [50, 0, 0, 50], // Round left corners
            },
            label: {
              show: true,
              formatter: function (params: { value: number }) {
                return params.value !== 0 ? Math.abs(params.value).toString() : "";
              },
              position: "outside",
              color: "#ffffff",
              fontSize: 12,
            },
            data: sortedJuryVotes.map((vote) =>
              vote === null || vote === 0 ? 0 : -1 * vote
            ),
          },
          {
            name: "Televote",
            type: "bar",
            stack: "Total",
            barWidth: barWidth,
            barGap: "10%",
            itemStyle: {
              borderRadius: [0, 50, 50, 0], // Round right corners
            },
            label: {
              show: true,
              formatter: function (params: { value: number }) {
                return params.value !== 0 ? params.value.toString() : "";
              },
              position: "outside",
              color: "#ffffff",
              fontSize: 12,
              align: "left",
              distance: 5,
            },
            data: sortedTelevoteVotes.map((vote) =>
              vote === null || vote === 0 ? 0 : vote
            ),
          },
        ],
      });
    } else {
      // Create simple column chart for available data (single voting system or only one type has data)
      let availableVotes = sortedJuryVotes;
      let seriesName = "Jury";
      
      // Determine which data to use based on actual data availability and voting system
      if (primaryVotingType === 'televote' || (!hasJuryData && hasTelevoteData)) {
        availableVotes = sortedTelevoteVotes;
        seriesName = "Televote";
      } else if (hasJuryData) {
        availableVotes = sortedJuryVotes;
        seriesName = "Jury";
      }

      chart.setOption({
        // Set the global color palette
        color: colorPalette,
        legend: {
          data: [seriesName],
          bottom: 10,
          textStyle: {
            color: "#ffffff",
          },
          show: false, // Hide legend for single voting systems
        },
        grid: {
          left: "5%",
          right: "5%",
          top: "20",
          bottom: "10%",
          containLabel: true,
        },
        // Remove tooltip
        tooltip: {
          show: false,
        },
        yAxis: {
          type: "category",
          data: sortedCountries,
          axisTick: {
            alignWithLabel: true,
          },
          // Increase space between countries
          axisLabel: {
            margin: 15,
          },
          // Hide grid lines
          splitLine: {
            show: false,
          },
        },
        xAxis: {
          type: "value",
          // Hide grid lines
          splitLine: {
            show: false,
          },
        },
        series: [
          {
            name: seriesName,
            type: "bar",
            barWidth: barWidth,
            itemStyle: {
              borderRadius: [0, 10, 10, 0], // Round right corners
            },
            label: {
              show: true,
              formatter: function (params: { value: number }) {
                return params.value !== 0 ? params.value.toString() : "";
              },
              position: "outside",
              color: "#ffffff",
              fontSize: 12,
            },
            data: availableVotes.map((vote) =>
              vote === null || vote === 0 ? 0 : vote
            ),
          },
        ],
      });
    }

    // Cleanup function
    return () => {
      chart.dispose();
    };
  }, [countryVotes, year]);

  return <div ref={chartRef} style={{ width: "100%", height }} />;
} 