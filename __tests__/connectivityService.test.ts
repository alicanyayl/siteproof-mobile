import NetInfo, {
  NetInfoStateType,
  type NetInfoCellularState,
  type NetInfoNoConnectionState,
  type NetInfoWifiState,
} from '@react-native-community/netinfo';

import {
  determineNetworkStatus,
  getCurrentNetworkStatus,
  shouldTriggerTransitionSync,
} from '@/features/sync/services/connectivityService';

describe('connectivityService', () => {
  it('identifies offline when isConnected is false', () => {
    const offlineState: NetInfoNoConnectionState = {
      details: null,
      isConnected: false,
      isInternetReachable: false,
      type: NetInfoStateType.none,
    };
    const status = determineNetworkStatus(offlineState);
    expect(status).toBe('offline');
  });

  it('identifies offline when isInternetReachable is false', () => {
    const unreachableState: NetInfoCellularState = {
      details: {
        carrier: null,
        cellularGeneration: null,
        isConnectionExpensive: false,
      },
      isConnected: true,
      isInternetReachable: false,
      type: NetInfoStateType.cellular,
    };
    const status = determineNetworkStatus(unreachableState);
    expect(status).toBe('offline');
  });

  it('identifies online when isConnected is true and reachability is not explicitly false', () => {
    const onlineState: NetInfoWifiState = {
      details: {
        bssid: null,
        frequency: null,
        ipAddress: null,
        isConnectionExpensive: false,
        linkSpeed: null,
        rxLinkSpeed: null,
        ssid: null,
        strength: null,
        subnet: null,
        txLinkSpeed: null,
      },
      isConnected: true,
      isInternetReachable: true,
      type: NetInfoStateType.wifi,
    };
    const status = determineNetworkStatus(onlineState);
    expect(status).toBe('online');
  });

  it('identifies unknown when isConnected is null or state is null', () => {
    const statusNull = determineNetworkStatus(null);
    const statusUndefined = determineNetworkStatus(undefined);
    expect(statusNull).toBe('unknown');
    expect(statusUndefined).toBe('unknown');
  });

  it('returns unknown when NetInfo.fetch() fails', async () => {
    const fetchSpy = jest.spyOn(NetInfo, 'fetch').mockRejectedValueOnce(new Error('NetInfo native error'));
    const status = await getCurrentNetworkStatus();
    expect(status).toBe('unknown');
    fetchSpy.mockRestore();
  });

  describe('shouldTriggerTransitionSync', () => {
    it('triggers sync when transitioning from offline to online', () => {
      expect(shouldTriggerTransitionSync('offline', 'online')).toBe(true);
    });

    it('triggers sync when transitioning from unknown to online', () => {
      expect(shouldTriggerTransitionSync('unknown', 'online')).toBe(true);
    });

    it('does not trigger sync on duplicate online -> online events', () => {
      expect(shouldTriggerTransitionSync('online', 'online')).toBe(false);
    });

    it('does not trigger sync on offline -> offline or online -> offline transitions', () => {
      expect(shouldTriggerTransitionSync('offline', 'offline')).toBe(false);
      expect(shouldTriggerTransitionSync('online', 'offline')).toBe(false);
    });
  });
});
