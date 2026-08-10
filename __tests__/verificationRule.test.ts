import { evaluateLocationVerification } from '@/features/location/domain/verificationRule';

describe('evaluateLocationVerification', () => {
  it('evaluates as verified when distance <= radius and accuracy is sufficient', () => {
    const result = evaluateLocationVerification({
      accuracyMeters: 10,
      distanceMeters: 50,
      verificationRadiusMeters: 100,
    });

    expect(result).toEqual({
      state: 'verified',
      verified: true,
    });
  });

  it('evaluates as outside_radius when distance > radius and accuracy is sufficient', () => {
    const result = evaluateLocationVerification({
      accuracyMeters: 15,
      distanceMeters: 250,
      verificationRadiusMeters: 100,
    });

    expect(result).toEqual({
      state: 'outside_radius',
      verified: false,
    });
  });

  it('evaluates as accuracy_insufficient when accuracy > verification radius', () => {
    const result = evaluateLocationVerification({
      accuracyMeters: 150,
      distanceMeters: 30,
      verificationRadiusMeters: 100,
    });

    expect(result).toEqual({
      state: 'accuracy_insufficient',
      verified: false,
    });
  });

  it('evaluates as accuracy_insufficient when accuracy is null', () => {
    const result = evaluateLocationVerification({
      accuracyMeters: null,
      distanceMeters: 20,
      verificationRadiusMeters: 100,
    });

    expect(result).toEqual({
      state: 'accuracy_insufficient',
      verified: false,
    });
  });
});
