export type VerificationResultState =
  | 'not_checked'
  | 'verified'
  | 'outside_radius'
  | 'accuracy_insufficient'
  | 'location_unavailable';

export type EvaluateLocationParams = {
  accuracyMeters: number | null;
  distanceMeters: number;
  verificationRadiusMeters: number;
};

export type EvaluatedVerification = {
  state: VerificationResultState;
  verified: boolean;
};

/**
 * Evaluates whether a location check satisfies the inspection verification criteria.
 *
 * Rules:
 * - If accuracy is null or greater than verificationRadiusMeters -> state: 'accuracy_insufficient', verified: false
 * - Otherwise:
 *   - If distanceMeters <= verificationRadiusMeters -> state: 'verified', verified: true
 *   - Otherwise -> state: 'outside_radius', verified: false
 */
export function evaluateLocationVerification({
  accuracyMeters,
  distanceMeters,
  verificationRadiusMeters,
}: EvaluateLocationParams): EvaluatedVerification {
  if (accuracyMeters === null || accuracyMeters > verificationRadiusMeters) {
    return {
      state: 'accuracy_insufficient',
      verified: false,
    };
  }

  if (distanceMeters <= verificationRadiusMeters) {
    return {
      state: 'verified',
      verified: true,
    };
  }

  return {
    state: 'outside_radius',
    verified: false,
  };
}
