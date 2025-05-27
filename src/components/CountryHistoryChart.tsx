"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { CHART_COLORS } from "@/utils/constants";

type CountryHistoryChartProps = {
  performances: Array<{
    year: number;
    finalPlace: number | null;
    semifinalPlace: number | null;
    venueType: "final" | "semifinal1" | "semifinal2" | null;
    qualified: boolean | null;
    artist?: string;
    title?: string;
  }>;
  countryName: string;
  height?: string;
};

export default function CountryHistoryChart({
  performances,
  countryName,
  height = "600px",
}: CountryHistoryChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    // Separate final and semi-final performances
    const finalPerformances = performances.filter((p) => p.finalPlace !== null);
    const semifinalOnlyPerformances = performances.filter(
      (p) => p.semifinalPlace !== null && p.finalPlace === null
    );

    // Find the worst (highest number) final place for this country
    const worstFinalPlace =
      finalPerformances.length > 0
        ? Math.max(...finalPerformances.map((p) => p.finalPlace!))
        : 26; // Default if no final performances

    // Get the current year for x-axis range (removed unused variable)

    // Find the first and last year the country participated
    const allYears = performances.map((p) => p.year);
    const startYear = Math.min(...allYears);
    const endYear = Math.max(...allYears);

    // Combine all performances into one dataset
    const allDataPoints: Array<{
      year: number;
      position: number;
      type: "final" | "semifinal";
      originalPosition: number;
      artist?: string;
      title?: string;
    }> = [];

    // Add final performances
    finalPerformances.forEach((p) => {
      allDataPoints.push({
        year: p.year,
        position: p.finalPlace!,
        type: "final",
        originalPosition: p.finalPlace!,
        artist: p.artist,
        title: p.title,
      });
    });

    // Add semi-final performances with adjusted positions
    semifinalOnlyPerformances.forEach((p) => {
      const adjustedPosition = worstFinalPlace + (p.semifinalPlace! - 10);
      allDataPoints.push({
        year: p.year,
        position: adjustedPosition,
        type: "semifinal",
        originalPosition: p.semifinalPlace!,
        artist: p.artist,
        title: p.title,
      });
    });

    // Sort by year
    allDataPoints.sort((a, b) => a.year - b.year);

    // Create chart data with gaps for missing years
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chartData: Array<[number, number, any] | [number, null]> = [];
    const participationYears = new Set(allDataPoints.map((p) => p.year));

    for (let year = startYear; year <= endYear; year++) {
      if (participationYears.has(year)) {
        const dataPoint = allDataPoints.find((p) => p.year === year);
        if (dataPoint) {
          chartData.push([year, dataPoint.position, dataPoint]);
        }
      } else {
        // Add null value to create a gap in the line
        chartData.push([year, null]);
      }
    }

    // Calculate maximum Y value to include all points
    const maxYValue = Math.max(
      worstFinalPlace,
      ...allDataPoints
        .filter((p) => p.type === "semifinal")
        .map((p) => p.position)
    );

    // Prepare mark points for wins (1st place)
    const winMarkPoints = finalPerformances
      .filter((p) => p.finalPlace === 1)
      .map((p) => ({
        coord: [p.year, p.finalPlace!],
        symbol: "circle",
        symbolSize: 30,
        itemStyle: {
          color: "#FFD700",
          borderColor: "#FFA500",
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: "🏆",
          fontSize: 16,
          color: "#FFD700",
          fontWeight: "bold",
        },
        // Add data for tooltip
        value: [p.year, p.finalPlace!, { 
          year: p.year, 
          position: p.finalPlace!, 
          type: "final", 
          originalPosition: p.finalPlace!,
          artist: p.artist,
          title: p.title 
        }],
      }));

    // Prepare mark line for separation between final and semi-final results
    const markLines =
      semifinalOnlyPerformances.length > 0
        ? [
            {
              yAxis: worstFinalPlace + 0.5,
              lineStyle: {
                color: "#88888888",
                width: 2,
                type: "solid",
              },
              symbol: "none", // Remove the arrow
              label: {
                show: false,
              },
            },
          ]
        : [];

    chart.setOption({
      color: CHART_COLORS,
      backgroundColor: "transparent",
      legend: {
        show: false,
      },
      visualMap: {
        show: false,
        type: "piecewise",
        dimension: 1,
        seriesIndex: 0,
        pieces: [
          {
            min: 1,
            max: worstFinalPlace + 0.5,
            color: CHART_COLORS[0],
          },
          {
            min: worstFinalPlace - 0.5,
            max: maxYValue + 1,
            color: "#ef476f",
          },
        ],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      grid: {
        left: "4%",
        right: "5%",
        bottom: "6%",
        top: "5%",
        containLabel: true,
      },
      xAxis: {
        type: "value",
        min: startYear,
        max: endYear,
        interval: 1,
        nameLocation: "middle",
        nameGap: 30,
        nameTextStyle: {
          color: "#ffffff",
          fontSize: 14,
        },
        axisLabel: {
          color: "#ffffff",
          fontSize: 12,
          formatter: (value: number) => value.toString(),
          rotate: 90,
        },
        axisLine: {
          lineStyle: {
            color: "#ffffff",
          },
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: "#333333",
            type: "dashed",
          },
        },
      },
      yAxis: {
        type: "value",
        min: 1,
        max: maxYValue + 1,
        inverse: true,
        minInterval: 1,
        nameGap: 50,
        nameTextStyle: {
          color: "#ffffff",
          fontSize: 14,
        },
        axisLabel: {
          color: "#ffffff",
          fontSize: 12,
          formatter: (value: number) => {
            if (value !== Math.floor(value)) return "";
            // Hide labels for positions below the worst final result
            if (value > worstFinalPlace) return "";
            if (value === 1) return "1st";
            if (value === 2) return "2nd";
            if (value === 3) return "3rd";
            return `${value}th`;
          },
        },
        axisLine: {
          lineStyle: {
            color: "#ffffff",
          },
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: "#333333",
            type: "dashed",
          },
        },
      },
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderColor: "#70b8ff",
        borderWidth: 1,
        textStyle: {
          color: "#ffffff",
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          if (!params.data) return "";
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let dataPoint: any = null;
          let year: number = 0;
          let place: number = 0;
          
          // Handle both regular data points and mark points
          if (Array.isArray(params.data)) {
            if (params.data.length >= 3) {
              // This is a data point with extra info [year, place, dataPoint]
              [year, place, dataPoint] = params.data;
            } else {
              // This is a simple data point [year, place]
              [year, place] = params.data;
              dataPoint = allDataPoints.find((p) => p.year === year);
            }
          } else {
            // Handle mark points
            if (params.data.value && Array.isArray(params.data.value)) {
              [year, place, dataPoint] = params.data.value;
            }
          }

          if (!dataPoint) return "";

          const artistTitle = dataPoint.artist && dataPoint.title 
            ? `${dataPoint.artist}: ${dataPoint.title}` 
            : countryName;

          if (dataPoint.type === "semifinal") {
            const suffix = dataPoint.originalPosition === 1 ? "st" 
              : dataPoint.originalPosition === 2 ? "nd" 
              : dataPoint.originalPosition === 3 ? "rd" 
              : "th";
            return `<strong>${artistTitle}</strong><br/>Year: ${year}<br/>Semi-final Position: ${dataPoint.originalPosition}${suffix}<br/><span style="color: #ef476f;">Did not qualify</span>`;
          }

          const suffix = place === 1 ? "st" : place === 2 ? "nd" : place === 3 ? "rd" : "th";
          return `<strong>${artistTitle}</strong><br/>Year: ${year}<br/>Final Position: ${place}${suffix}`;
        },
      },
      series: [
        {
          name: `${countryName} Eurovision Results`,
          type: "line",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: chartData as any,
          symbol: "circle",
          symbolSize: 8,
          lineStyle: {
            width: 3,
          },
          itemStyle: {
            borderWidth: 0,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
          markPoint: {
            data: winMarkPoints,
            tooltip: {
              show: true,
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
          markLine: {
            data: markLines,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        },
      ],
    });

    // Handle window resize
    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener("resize", handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [performances, countryName]);

  return <div ref={chartRef} style={{ width: "100%", height }} />;
}
