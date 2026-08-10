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

export function subscribeToNetworkStatus(onChange: (status: NetworkStatus) => void): () => void {
  try {
    return NetInfo.addEventListener((state) => {
      onChange(determineNetworkStatus(state));
    });
  } catch {
    return () => {};
  }
}

export async function getCurrentNetworkStatus(): Promise<NetworkStatus> {
  try {
    const state = await NetInfo.fetch();
    return determineNetworkStatus(state);
  } catch {
    return 'online';
  }
}
