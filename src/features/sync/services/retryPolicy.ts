/**
 * Calculates retry delay in seconds based on attempt count.
 * Attempt 1 -> 2 seconds
 * Attempt 2 -> 5 seconds
 * Attempt 3 -> 15 seconds
 * Attempt 4+ -> 60 seconds max
 */
export function calculateRetryDelaySeconds(attemptCount: number): number {
  if (attemptCount <= 1) {
    return 2;
  }
  if (attemptCount === 2) {
    return 5;
  }
  if (attemptCount === 3) {
    return 15;
  }
  return 60;
}

export function calculateNextAttemptAtIso(attemptCount: number, now: Date = new Date()): string {
  const delaySeconds = calculateRetryDelaySeconds(attemptCount);
  return new Date(now.getTime() + delaySeconds * 1000).toISOString();
}
