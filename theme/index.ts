import { colors } from './colors';
import { typography } from './typography';
import { spacing, borderRadius } from './spacing';
import { shadows } from './shadows';

// Define the structure for status colors to ensure consistency
const statusColors = {
  approved: {
    main: colors.success?.[500] || '#10B981',
    bg: colors.success?.[50] || '#ECFDF5',
    border: colors.success?.[100] || '#D1FAE5',
  },
  rejected: {
    main: colors.error?.[500] || '#EF4444',
    bg: colors.error?.[50] || '#FEF2F2',
    border: colors.error?.[100] || '#FEE2E2',
  },
  pending: {
    main: colors.warning?.[500] || '#F59E0B',
    bg: colors.warning?.[50] || '#FFFBEB',
    border: colors.warning?.[100] || '#FEF3C7',
  },
};

export const theme = {
  colors: {
    ...colors,
    
    // Usage-based Backgrounds
    background: {
      main: colors.background?.dark || '#F8F9FA',
      surface: '#FFFFFF',
      subtle: colors.primary[50] || '#F5F7FF',
      inverse: '#1A1A1A',
      light:'#FFFFFF',
      dark: colors.background?.dark || '#F8F9FA',
      darker: colors.background?.darker || '#F0F2F5',
      
    },

    // // Usage-based Text
    // text: {
    //   primary: colors.text?.primary || '#1A1A1A',
    //   secondary: colors.text?.secondary || '#666666',
    //   tertiary: colors.text?.tertiary || '#999999',
    //   inverse: '#FFFFFF',
    //   error: colors.error?.[500] || '#EF4444',
    //   success: colors.success?.[500] || '#10B981',
    //   link: colors.primary[500] || '#6366F1',
    // },

    // Semantic Status Logic
    status: statusColors,
  },

  typography: {
    ...typography,
    variants: {
      h1: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
      h2: { fontSize: 20, fontWeight: '700' as const, lineHeight: 28 },
      body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
      bodyBold: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
      caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
      label: { fontSize: 11, fontWeight: '700' as const, lineHeight: 14, textTransform: 'uppercase' as const },
    }
  },

  spacing: {
    ...spacing,
    container: spacing[4] || 16,
    stack: spacing[3] || 12,
  },

  borderRadius: {
    ...borderRadius,
    card: borderRadius.xl || 16,
    button: borderRadius.lg || 12,
    pill: 999,
  },

  shadows,

  layout: {
    gutter: spacing[4] || 16,
    cardPadding: spacing[4] || 16,
    // Add a helper for common screen padding
    screenPadding: spacing[4] || 16,
  }
};

export type Theme = typeof theme;