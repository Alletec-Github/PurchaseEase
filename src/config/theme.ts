export const theme = {
  colors: {
    primary: '#0078D4',
    primaryDark: '#005A9E',
    primaryLight: '#DEECF9',
    white: '#FFFFFF',
    black: '#000000',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#6E6E6E',
    textLight: '#999999',
    border: '#E0E0E0',
    borderLight: '#F0F0F0',
    error: '#D32F2F',
    success: '#34C759',
    warning: '#FF9500',
    info: '#0078D4',

    // Status colors
    statusDraft: '#8E8E93',
    statusOpen: '#0078D4',
    statusInReview: '#FF9500',
    statusReceived: '#34C759',

    // Status background colors (light)
    statusDraftBg: '#F2F2F7',
    statusOpenBg: '#DEECF9',
    statusInReviewBg: '#FFF3E0',
    statusReceivedBg: '#E8F5E9',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 20,
    full: 999,
  },

  typography: {
    h1: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 34,
    },
    h2: {
      fontSize: 22,
      fontWeight: '700' as const,
      lineHeight: 28,
    },
    h3: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 22,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 22,
    },
  },

  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    cardLight: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
  },
};

export type Theme = typeof theme;
