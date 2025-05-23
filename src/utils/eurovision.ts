/**
 * Eurovision voting system utility functions
 * Based on the actual historical timeline of Eurovision voting systems
 */

/**
 * Determines the type of voting system used in a given year
 */
export function getVotingSystemType(year: number): 'jury' | 'televote' | 'hybrid' | 'mixed' {
  if (year <= 1996) {
    return 'jury';
  } else if (year === 1997) {
    return 'mixed'; // Some countries had televote, others jury
  } else if (year >= 1998 && year <= 2000) {
    return 'televote';
  } else if (year >= 2001 && year <= 2002) {
    return 'mixed'; // Countries could choose
  } else if (year >= 2003 && year <= 2008) {
    return 'televote';
  } else {
    return 'hybrid'; // 2009+ is 50/50 jury+televote
  }
}

/**
 * Determines if a Eurovision contest uses the modern voting system (jury + televote split)
 * The modern system was introduced in 2009
 */
export function hasModernVotingSystem(year: number): boolean {
  return year >= 2009;
}

/**
 * Determines if a contest should show separate jury and televote data
 * For older contests (pre-2016), only show combined data even if hybrid
 */
export function shouldShowSeparateVotes(year: number): boolean {
  return year >= 2016;
}

/**
 * Determines if the contest uses a single voting system (not hybrid)
 */
export function isSingleVotingSystem(year: number): boolean {
  const system = getVotingSystemType(year);
  return system === 'jury' || system === 'televote';
}

/**
 * Gets the primary voting type for single voting system years
 */
export function getPrimaryVotingType(year: number): 'jury' | 'televote' | null {
  if (!isSingleVotingSystem(year)) {
    return null;
  }
  
  const system = getVotingSystemType(year);
  return system as 'jury' | 'televote';
} 