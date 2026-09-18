export const NOT_STARTED = "notStarted";
export const LIVE = "live";
export const ENDED = "ended";


export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const REDIS_QUEUE_NAME = "submissions";
export const LIVE_LEADERBOARD_PREFIX = "contest_leaderboard_";
export const LEADERBOARD_CHANNEL_PREFIX = "contest_leaderboard_updates_";
export const LEADERBOARD_SCORE_MULTIPLIER = 1_000_000;

export function leaderboardKey(contestId: string) {
  return `${LIVE_LEADERBOARD_PREFIX}${contestId}`;
}

export function leaderboardChannel(contestId: string) {
  return `${LEADERBOARD_CHANNEL_PREFIX}${contestId}`;
}

export function leaderboardSortScore(score: number, penalty: number) {
  return score * LEADERBOARD_SCORE_MULTIPLIER - penalty;
}
