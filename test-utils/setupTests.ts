// @ts-expect-error netinfo-mock.js does not carry declaration file
import mockRNCNetInfo from '@react-native-community/netinfo/jest/netinfo-mock.js';

jest.mock('@react-native-community/netinfo', () => mockRNCNetInfo);

jest.mock('expo-notifications', () => ({
  addNotificationResponseReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notif-id-1'),
  setNotificationHandler: jest.fn(),
}));

jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn().mockResolvedValue({ uri: 'file:///app/cache/report.pdf' }),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));
