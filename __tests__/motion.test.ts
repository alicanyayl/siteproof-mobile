import { renderHook } from '@testing-library/react-native';
import { AccessibilityInfo, type EmitterSubscription } from 'react-native';

import { useReduceMotion } from '@/features/motion/useReduceMotion';

describe('useReduceMotion', () => {
  it('returns reduce motion state from AccessibilityInfo', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValueOnce(true);
    const mockSubscription: EmitterSubscription = {
      eventType: 'reduceMotionChanged',
      key: '1',
      listener: jest.fn(),
      remove: jest.fn(),
    };
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue(mockSubscription);

    const { result } = renderHook(() => useReduceMotion());
    expect(result.current).toBe(false); // Initial default before promise resolves
  });
});
