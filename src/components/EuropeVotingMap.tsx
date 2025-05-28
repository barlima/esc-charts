"use client";

import { useMemo } from "react";
// @ts-expect-error - react-simple-maps doesn't have types for React 19
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { Box, Text } from "@radix-ui/themes";
import Link from "next/link";

type VotingData = {
  countryId: number;
  countryName: string;
  totalPoints: number;
};

type EuropeVotingMapProps = {
  data: VotingData[];
  title: string;
  height?: number;
};

// World map topology URL (includes Europe and Australia)
const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

// Country name mapping for consistency
const COUNTRY_NAME_MAPPING: Record<string, string> = {
  "Bosnia and Herzegovina": "Bosnia and Herz.",
  "Czech Republic": "Czech Rep.",
  "North Macedonia": "North Macedonia",
  "United Kingdom": "United Kingdom",
  Russia: "Russia",
  Turkey: "Turkey",
  Türkiye: "Turkey",
  Australia: "Australia",
  Macedonia: "North Macedonia", // Map data uses "Macedonia" but our data uses "North Macedonia"
  // Add more mappings as needed
};

export default function EuropeVotingMap({
  data,
  title,
  height = 400,
}: EuropeVotingMapProps) {
  console.log("Color mapping debug:", {
    minPoints:
      data.length > 0 ? Math.min(...data.map((d) => d.totalPoints)) : 0,
    maxPoints:
      data.length > 0 ? Math.max(...data.map((d) => d.totalPoints)) : 0,
    dataLength: data.length,
  });

  console.log("Map data sample:", data.slice(0, 3));

  // Create a map of country names to voting data
  const countryDataMap = useMemo(() => {
    const map = new Map<string, VotingData>();
    data.forEach((item) => {
      const mappedName =
        COUNTRY_NAME_MAPPING[item.countryName] || item.countryName;
      map.set(mappedName.toLowerCase(), item);
      // Also add original name as fallback
      map.set(item.countryName.toLowerCase(), item);
    });
    console.log("Country data map created with keys:", Array.from(map.keys()));
    return map;
  }, [data]);

  // Calculate color based on points
  const getCountryColor = (countryName: string) => {
    // First try direct lookup
    let countryData = countryDataMap.get(countryName.toLowerCase());

    // If not found, try reverse mapping (map name -> our data name)
    if (!countryData) {
      const mappedName = COUNTRY_NAME_MAPPING[countryName];
      if (mappedName) {
        countryData = countryDataMap.get(mappedName.toLowerCase());
        if (countryData) {
          console.log(
            `Mapped ${countryName} -> ${mappedName} -> found data:`,
            countryData
          );
        }
      }
    }

    if (!countryData) {
      return "#f0f0f0"; // Light gray for countries with no data
    }

    if (data.length === 0) return "#f0f0f0";

    const maxPoints = Math.max(...data.map((d) => d.totalPoints));
    const minPoints = Math.min(...data.map((d) => d.totalPoints));

    if (maxPoints === minPoints) {
      return "#ffa057"; // Base color if all values are the same
    }

    // Normalize the points to a 0-1 scale
    const normalizedPoints =
      (countryData.totalPoints - minPoints) / (maxPoints - minPoints);

    // Create gradient from light orange to dark orange
    const lightColor = { r: 255, g: 244, b: 230 }; // #fff4e6
    const baseColor = { r: 255, g: 160, b: 87 }; // #ffa057
    const darkColor = { r: 204, g: 122, b: 61 }; // #cc7a3d

    let r, g, b;
    if (normalizedPoints < 0.5) {
      // Interpolate between light and base color
      const factor = normalizedPoints * 2;
      r = Math.round(lightColor.r + (baseColor.r - lightColor.r) * factor);
      g = Math.round(lightColor.g + (baseColor.g - lightColor.g) * factor);
      b = Math.round(lightColor.b + (baseColor.b - lightColor.b) * factor);
    } else {
      // Interpolate between base and dark color
      const factor = (normalizedPoints - 0.5) * 2;
      r = Math.round(baseColor.r + (darkColor.r - baseColor.r) * factor);
      g = Math.round(baseColor.g + (darkColor.g - baseColor.g) * factor);
      b = Math.round(baseColor.b + (darkColor.b - baseColor.b) * factor);
    }

    return `rgb(${r}, ${g}, ${b})`;
  };

  // Filter to show only Europe and Australia
  const isRelevantCountry = (countryName: string) => {
    const europeanCountries = [
      "albania",
      "andorra",
      "armenia",
      "austria",
      "azerbaijan",
      "belarus",
      "belgium",
      "bosnia and herz.",
      "bosnia and herzegovina",
      "bulgaria",
      "croatia",
      "cyprus",
      "czech rep.",
      "czech republic",
      "czechia",
      "denmark",
      "estonia",
      "finland",
      "france",
      "georgia",
      "germany",
      "greece",
      "hungary",
      "iceland",
      "ireland",
      "kosovo",
      "italy",
      "latvia",
      "lithuania",
      "luxembourg",
      "malta",
      "macedonia",
      "moldova",
      "monaco",
      "montenegro",
      "netherlands",
      "north macedonia",
      "norway",
      "poland",
      "portugal",
      "romania",
      "russia",
      "russian federation",
      "san marino",
      "serbia",
      "slovakia",
      "slovenia",
      "spain",
      "sweden",
      "switzerland",
      "turkey",
      "ukraine",
      "united kingdom",
      "uk",
      "israel",
      "morocco",
      "algeria",
      "libya",
      "tunisia",
      "egypt",
      "palestine",
      "syria",
      "jordan",
      "lebanon",
      "iran",
      "iraq",
      "saudi arabia",
      "kuwait",
      "qatar",
      "bahrain",
      "oman",
    ];

    const name = countryName.toLowerCase();
    return europeanCountries.includes(name) || name === "australia";
  };

  return (
    <Box>
      <Box style={{ textAlign: "center", marginBottom: "16px" }}>
        <Text size="4" weight="bold">
          {title}
        </Text>
      </Box>

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 640,
          center: [10, 54], // Center on Europe
        }}
        width={1000}
        height={height}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={geoUrl}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {({ geographies }: { geographies: any[] }) => {
            console.log("Geographies loaded:", geographies.length);
            console.log("Sample geography:", geographies[0]?.properties);

            if (!geographies || geographies.length === 0) {
              console.log("No geographies loaded");
              return (
                <text
                  x="400"
                  y="200"
                  textAnchor="middle"
                  fill="#666"
                  fontSize="16"
                >
                  Loading map data...
                </text>
              );
            }

            const filteredGeographies = geographies.filter((geo) => {
              const countryName =
                geo.properties.NAME ||
                geo.properties.name ||
                geo.properties.NAME_EN;
              return isRelevantCountry(countryName);
            });

            console.log("Filtered geographies:", filteredGeographies.length);
            console.log(
              "Filtered countries:",
              filteredGeographies.map(
                (geo) => geo.properties.NAME || geo.properties.name
              )
            );

            return filteredGeographies.map((geo) => {
              const countryName =
                geo.properties.NAME ||
                geo.properties.name ||
                geo.properties.NAME_EN;
              const countryData = countryDataMap.get(countryName.toLowerCase());

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getCountryColor(countryName)}
                  stroke="#333"
                  strokeWidth={0.5}
                  style={{
                    default: {
                      outline: "none",
                    },
                    hover: {
                      outline: "none",
                      cursor: "pointer",
                    },
                    pressed: {
                      outline: "none",
                    },
                  }}
                  title={
                    countryData
                      ? `${countryData.countryName}: ${countryData.totalPoints} points`
                      : `${countryName}: No voting data`
                  }
                />
              );
            });
          }}
        </Geographies>
      </ComposableMap>

      {/* Color Legend */}
      <Box
        mt="3"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
        }}
      >
        <Text size="2">Low</Text>
        <Box
          style={{
            width: "100px",
            height: "20px",
            background: "linear-gradient(to right, #fff4e6, #ffa057, #cc7a3d)",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
        <Text size="2">High</Text>
      </Box>

      {/* Historical and Special Countries */}
      {(() => {
        const historicalCountries = [
          "Australia",
          "Yugoslavia",
          "Serbia & Montenegro",
          "Serbia and Montenegro",
          "World",
        ];

        // Create a complete list with all historical countries, showing 0 points if no data exists
        const historicalData = historicalCountries.map(countryName => {
          // Find existing data for this country
          const existingData = data.find(item => {
            const itemName = item.countryName.toLowerCase();
            const historicalLower = countryName.toLowerCase();
            
            // Exact match for compound country names
            if (historicalLower === "serbia and montenegro" || historicalLower === "serbia & montenegro") {
              return itemName === "serbia and montenegro" || itemName === "serbia & montenegro";
            }
            // Regular matching for other countries
            return itemName === historicalLower;
          });

          // Return existing data or create a 0-point entry
          return existingData || {
            countryId: Math.random(), // Generate a temporary ID for countries with no data
            countryName: countryName,
            totalPoints: 0
          };
        })
        // Remove duplicates (in case both "Serbia & Montenegro" and "Serbia and Montenegro" exist)
        .filter((country, index, array) => {
          const countryLower = country.countryName.toLowerCase();
          const isSerbiaMontenegro = countryLower === "serbia & montenegro" || countryLower === "serbia and montenegro";
          
          if (isSerbiaMontenegro) {
            // Keep only the first Serbia and Montenegro entry found
            return array.findIndex(c => {
              const cLower = c.countryName.toLowerCase();
              return cLower === "serbia & montenegro" || cLower === "serbia and montenegro";
            }) === index;
          }
          return true;
        });

        return (
          <Box mt="4">
            <Box style={{ textAlign: "center", marginBottom: "12px" }}>
              <Text size="3" weight="bold">
                Historical & Special Participants
              </Text>
            </Box>
            
            <Box
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "8px",
                padding: "12px",
                backgroundColor: "#1a1a1a",
                borderRadius: "8px",
                border: "1px solid #333",
              }}
            >
              {historicalData
                .sort((a, b) => b.totalPoints - a.totalPoints)
                .map((country) => (
                  <Box
                    key={country.countryId}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 8px",
                      backgroundColor: "#2a2a2a",
                      borderRadius: "4px",
                      border: "1px solid #444",
                    }}
                  >
                    {country.totalPoints > 0 ? (
                      <Link 
                        href={`/country/${country.countryId}`}
                        style={{ 
                          textDecoration: "none",
                          cursor: "pointer"
                        }}
                      >
                        <Text 
                          size="2" 
                          weight="medium" 
                          style={{ 
                            color: "#e0e0e0"
                          }}
                        >
                          {country.countryName}
                        </Text>
                      </Link>
                    ) : (
                      <Text size="2" weight="medium" style={{ color: "#e0e0e0" }}>
                        {country.countryName}
                      </Text>
                    )}
                    <Text size="2" weight="bold" style={{ color: "#ffa057" }}>
                      {country.totalPoints}
                    </Text>
                  </Box>
                ))}
            </Box>
          </Box>
        );
      })()}
    </Box>
  );
}
