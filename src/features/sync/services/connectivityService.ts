import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

import type { NetworkStatus } from '@/features/tasks/domain/task';

export function determineNetworkStatus(state: NetInfoState): NetworkStatus {
  if (state.isConnected === false || state.isInternetReachable === false) {
    return 'offline';
  }
  if (state.isConnected === true) {
    return 'online';
  }
  return 'unknown';
}

export function subscribeToNetworkStatus(onChange: (status: NetworkStatus) => void): () => void {
  return NetInfo.addEventListener((state) => {
    onChange(determineNetworkStatus(state));
  });
}

export async function getCurrentNetworkStatus(): Promise<NetworkStatus> {
  const state = await NetInfo.fetch();
  return determineNetworkStatus(state);
}
