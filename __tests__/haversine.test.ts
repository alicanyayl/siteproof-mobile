import { calculateHaversineDistance } from '@/features/location/domain/haversine';

describe('calculateHaversineDistance', () => {
  it('returns 0 for identical coordinates', () => {
    const point = { latitude: 37.7749, longitude: -122.4194 };
    const distance = calculateHaversineDistance(point, point);
    expect(distance).toBe(0);
  });

  it('calculates known distance accurately within reasonable tolerance', () => {
    // San Francisco (37.7749, -122.4194) to Oakland (37.8044, -122.2712) ~13.5 km
    const sf = { latitude: 37.7749, longitude: -122.4194 };
    const oakland = { latitude: 37.8044, longitude: -122.2712 };

    const distanceMeters = calculateHaversineDistance(sf, oakland);

    // Should be approximately 13500 meters (between 13000m and 14000m)
    expect(distanceMeters).toBeGreaterThan(13000);
    expect(distanceMeters).toBeLessThan(14000);
  });

  it('handles short distance calculation precisely', () => {
    // ~111 meters apart vertically (0.001 degree latitude)
    const p1 = { latitude: 51.5074, longitude: -0.1278 };
    const p2 = { latitude: 51.5084, longitude: -0.1278 };

    const distanceMeters = calculateHaversineDistance(p1, p2);

    expect(distanceMeters).toBeGreaterThan(105);
    expect(distanceMeters).toBeLessThan(115);
  });
});
