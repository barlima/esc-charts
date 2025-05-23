/**
 * Determines if a Eurovision contest uses the modern voting system (jury + televote split)
 * The modern system was introduced in 2016
 */
export function hasModernVotingSystem(year: number): boolean {
  return year >= 2016;
}

/**
 * Determines if a contest should show separate jury and televote data
 * For older contests (pre-2016), only show combined data
 */
export function shouldShowSeparateVotes(year: number): boolean {
  return hasModernVotingSystem(year);
} 