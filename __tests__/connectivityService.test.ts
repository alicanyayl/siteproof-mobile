import { NetInfoStateType } from '@react-native-community/netinfo';

import { determineNetworkStatus } from '@/features/sync/services/connectivityService';

describe('connectivityService', () => {
  it('identifies offline when isConnected is false', () => {
    const status = determineNetworkStatus({
      details: null,
      isConnected: false,
      isInternetReachable: true,
      type: NetInfoStateType.wifi,
    });
    expect(status).toBe('offline');
  });

  it('identifies offline when isInternetReachable is false', () => {
    const status = determineNetworkStatus({
      details: null,
      isConnected: true,
      isInternetReachable: false,
      type: NetInfoStateType.cellular,
    });
    expect(status).toBe('offline');
  });

  it('identifies online when isConnected is true and reachability is not explicitly false', () => {
    const status = determineNetworkStatus({
      details: null,
      isConnected: true,
      isInternetReachable: true,
      type: NetInfoStateType.wifi,
    });
    expect(status).toBe('online');
  });

  it('identifies unknown when isConnected is null or state is null', () => {
    const statusNull = determineNetworkStatus(null);
    const statusUndefined = determineNetworkStatus(undefined);
    expect(statusNull).toBe('unknown');
    expect(statusUndefined).toBe('unknown');
  });
});
