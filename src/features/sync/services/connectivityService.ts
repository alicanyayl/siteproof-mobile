import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

import type { NetworkStatus } from '@/features/tasks/domain/task';

export function determineNetworkStatus(state: NetInfoState | null | undefined): NetworkStatus {
  if (state == null) {
    return 'unknown';
  }
  if (state.isConnected === false || state.isInternetReachable === false) {
    return 'offline';
  }
  if (state.isConnected === true) {
    return 'online';
  }
  return 'unknown';
}

export function shouldTriggerTransitionSync(
  prevStatus: NetworkStatus,
  newStatus: NetworkStatus,
): boolean {
  return (prevStatus === 'offline' || prevStatus === 'unknown') && newStatus === 'online';
}

export function subscribeToNetworkStatus(onChange: (status: NetworkStatus) => void): () => void {
  try {
    return NetInfo.addEventListener((state) => {
      onChange(determineNetworkStatus(state));
    });
  } catch (error) {
    console.warn('Failed to subscribe to network status changes:', error);
    return () => {};
  }
}

export async function getCurrentNetworkStatus(): Promise<NetworkStatus> {
  try {
    const state = await NetInfo.fetch();
    return determineNetworkStatus(state);
  } catch (error) {
    console.warn('Failed to fetch current network status:', error);
    return 'unknown';
  }
}
