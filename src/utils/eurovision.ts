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
 * Determines the type of voting system used for a specific venue type and year
 * Starting in 2023, semi-finals use only televoting while finals remain hybrid
 */
export function getVotingSystemTypeForVenue(
  year: number, 
  venueType: 'final' | 'semifinal1' | 'semifinal2'
): 'jury' | 'televote' | 'hybrid' | 'mixed' {
  // Starting in 2023, semi-finals are decided entirely by public televoting
  if (year >= 2023 && (venueType === 'semifinal1' || venueType === 'semifinal2')) {
    return 'televote';
  }
  
  // For finals or years before 2023, use the standard system
  return getVotingSystemType(year);
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
 * Starting in 2023, semi-finals only show televote data
 */
export function shouldShowSeparateVotes(year: number, venueType?: 'final' | 'semifinal1' | 'semifinal2'): boolean {
  if (year < 2016) {
    return false;
  }
  
  // Starting in 2023, semi-finals only have televote data
  if (year >= 2023 && venueType && (venueType === 'semifinal1' || venueType === 'semifinal2')) {
    return false;
  }
  
  return true;
}

/**
 * Determines if the contest uses a single voting system (not hybrid) for a specific venue
 */
export function isSingleVotingSystem(year: number, venueType?: 'final' | 'semifinal1' | 'semifinal2'): boolean {
  const system = venueType 
    ? getVotingSystemTypeForVenue(year, venueType)
    : getVotingSystemType(year);
  return system === 'jury' || system === 'televote';
}

/**
 * Gets the primary voting type for single voting system years/venues
 */
export function getPrimaryVotingType(year: number, venueType?: 'final' | 'semifinal1' | 'semifinal2'): 'jury' | 'televote' | null {
  if (!isSingleVotingSystem(year, venueType)) {
    return null;
  }
  
  const system = venueType 
    ? getVotingSystemTypeForVenue(year, venueType)
    : getVotingSystemType(year);
  return system as 'jury' | 'televote';
}

/**
 * Determines if jury votes exist for a specific venue and year
 * Starting in 2023, semi-finals don't have jury votes
 */
export function hasJuryVotes(year: number, venueType: 'final' | 'semifinal1' | 'semifinal2'): boolean {
  const system = getVotingSystemTypeForVenue(year, venueType);
  return system === 'jury' || system === 'hybrid' || system === 'mixed';
}

/**
 * Determines if televote exists for a specific venue and year
 */
export function hasTeleVotes(year: number, venueType: 'final' | 'semifinal1' | 'semifinal2'): boolean {
  const system = getVotingSystemTypeForVenue(year, venueType);
  return system === 'televote' || system === 'hybrid' || system === 'mixed';
} 