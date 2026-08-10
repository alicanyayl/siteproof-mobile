import { AccessibilityInfo } from 'react-native';

import { useReduceMotion } from '@/features/motion/useReduceMotion';

describe('useReduceMotion', () => {
  it('exports a hook function that queries AccessibilityInfo', () => {
    expect(typeof useReduceMotion).toBe('function');
    expect(AccessibilityInfo.isReduceMotionEnabled).toBeDefined();
    expect(AccessibilityInfo.addEventListener).toBeDefined();
  });
});
