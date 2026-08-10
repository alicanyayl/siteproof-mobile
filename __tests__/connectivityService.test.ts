import { determineNetworkStatus } from '@/features/sync/services/connectivityService';

describe('connectivityService', () => {
  it('identifies offline when isConnected is false', () => {
    const status = determineNetworkStatus({
      details: null,
      isConnected: false,
      isInternetReachable: true,
      type: 'wifi' as any,
    });
    expect(status).toBe('offline');
  });

  it('identifies offline when isInternetReachable is false', () => {
    const status = determineNetworkStatus({
      details: null,
      isConnected: true,
      isInternetReachable: false,
      type: 'cellular' as any,
    });
    expect(status).toBe('offline');
  });

  it('identifies online when isConnected is true and reachability is not explicitly false', () => {
    const status = determineNetworkStatus({
      details: null,
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi' as any,
    });
    expect(status).toBe('online');
  });

  it('identifies unknown when isConnected is null', () => {
    const status = determineNetworkStatus({
      details: null,
      isConnected: null as any,
      isInternetReachable: null as any,
      type: 'unknown' as any,
    });
    expect(status).toBe('unknown');
  });
});
