/**
 * Color constants for the Caeli mobile app
 * Centralized color definitions to avoid ESLint color-literals warnings
 */

export const COLORS = {
  // Brand colors
  brand: {
    gold: '#C5BD83',
    brown: '#8B7355',
    cream: '#f9f8f0',
    lightCream: '#E9E4B8',
  },

  // Neutral colors
  neutral: {
    white: '#FFFFFF',
    black: '#000000',
    lightGray: '#f5f5f5',
    gray: '#D9D9D9',
    mediumGray: '#898989',
    darkGray: '#666666',
    charcoal: '#333333',
    silver: '#b3b3b3',
    border: '#ddd',
    borderLight: '#eee',
    borderMedium: '#ccc',
    disabled: '#e5e5e5',
    placeholder: '#999',
    text: '#555',
    textDark: '#444',
    lightBorder: '#C0C0C0',
  },

  // Semantic colors
  semantic: {
    success: '#4CAF50',
    successLight: '#e7f6e7',
    error: '#E74C3C',
    info: '#e3f2fd',
  },

  // Opacity variants
  opacity: {
    whiteHigh: 'rgba(255, 255, 255, 0.95)',
    whiteMedium: 'rgba(255, 255, 255, 0.9)',
    whiteLow: 'rgba(255, 255, 255, 0.2)',
    blackOverlay: 'rgba(0, 0, 0, 0.4)',
  },

  // Task importance colors (for assignement.tsx)
  taskImportance: {
    low: 'green',
    medium: 'orange',
    high: 'red',
  },

  // Shadow color
  shadow: '#000',
} as const;

// Export individual color groups for easier imports
export const { brand, neutral, semantic, opacity, taskImportance } = COLORS;
