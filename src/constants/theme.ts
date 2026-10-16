import { colors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';

// 테두리 대신 쓰는 아주 옅은 그림자 (따뜻한 갈색 계열)
export const shadows = {
  card: {
    shadowColor: '#6B5640',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },

  soft: {
    shadowColor: '#6B5640',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  xxl: 28,
  full: 999,
};

export const theme = {
  colors,
  spacing,
  typography,
  shadows,
  radius,
};
