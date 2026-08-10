import * as Location from 'expo-location';

export type CurrentLocationResult = {
  accuracyMeters: number | null;
  latitude: number;
  longitude: number;
};

export async function requestForegroundLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === Location.PermissionStatus.GRANTED;
}

export async function getForegroundLocationPermissionStatus(): Promise<Location.PermissionStatus> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status;
}

export async function acquireCurrentPosition(): Promise<CurrentLocationResult> {
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    accuracyMeters: position.coords.accuracy ?? null,
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}
