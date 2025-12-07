import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

interface Theme {
  mode: ThemeMode;
  isDark: boolean;
  colors: {
    // Background
    background: string;
    surface: string;
    card: string;

    // Primary brand colors
    primary: string;
    primaryLight: string;
    primaryDark: string;

    // Accent colors
    accent: string;
    accentLight: string;

    // Text colors
    text: string;
    textSecondary: string;
    textTertiary: string;

    // Borders and dividers
    border: string;
    divider: string;

    // Status colors
    success: string;
    successLight: string;
    warning: string;
    warningLight: string;
    error: string;
    errorLight: string;
    info: string;
    infoLight: string;

    // Task status colors
    taskOpen: string;
    taskOpenBg: string;
    taskDone: string;
    taskDoneBg: string;
    taskCancelled: string;
    taskCancelledBg: string;

    // Interactive elements
    buttonPrimary: string;
    buttonPrimaryText: string;
    buttonSecondary: string;
    buttonSecondaryText: string;

    // Shadows and overlays
    shadow: string;
    overlay: string;

    // Special
    navbar: string;
    navbarText: string;
    navbarActive: string;
  };
}

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const THEME_STORAGE_KEY = '@caeli_theme_mode';

// Modern color palettes
const lightTheme: Theme['colors'] = {
  // Background - Clean whites and light grays
  background: '#FAFAFA',
  surface: '#FFFFFF',
  card: '#FFFFFF',

  // Primary - Modern purple/indigo
  primary: '#6366F1', // Indigo-500
  primaryLight: '#818CF8', // Indigo-400
  primaryDark: '#4F46E5', // Indigo-600

  // Accent - Vibrant cyan
  accent: '#06B6D4', // Cyan-500
  accentLight: '#22D3EE', // Cyan-400

  // Text - High contrast
  text: '#1F2937', // Gray-800
  textSecondary: '#6B7280', // Gray-500
  textTertiary: '#9CA3AF', // Gray-400

  // Borders
  border: '#E5E7EB', // Gray-200
  divider: '#F3F4F6', // Gray-100

  // Status - Modern, accessible colors
  success: '#10B981', // Emerald-500
  successLight: '#D1FAE5', // Emerald-100
  warning: '#F59E0B', // Amber-500
  warningLight: '#FEF3C7', // Amber-100
  error: '#EF4444', // Red-500
  errorLight: '#FEE2E2', // Red-100
  info: '#3B82F6', // Blue-500
  infoLight: '#DBEAFE', // Blue-100

  // Task status
  taskOpen: '#F59E0B', // Amber-500
  taskOpenBg: '#FEF3C7', // Amber-100
  taskDone: '#10B981', // Emerald-500
  taskDoneBg: '#D1FAE5', // Emerald-100
  taskCancelled: '#EF4444', // Red-500
  taskCancelledBg: '#FEE2E2', // Red-100

  // Interactive
  buttonPrimary: '#6366F1',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondary: '#F3F4F6',
  buttonSecondaryText: '#1F2937',

  // Effects
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Navbar
  navbar: '#FFFFFF',
  navbarText: '#6B7280',
  navbarActive: '#6366F1',
};

const darkTheme: Theme['colors'] = {
  // Background - Rich dark colors
  background: '#0F172A', // Slate-900
  surface: '#1E293B', // Slate-800
  card: '#1E293B', // Slate-800

  // Primary - Brighter for dark mode
  primary: '#818CF8', // Indigo-400
  primaryLight: '#A5B4FC', // Indigo-300
  primaryDark: '#6366F1', // Indigo-500

  // Accent
  accent: '#22D3EE', // Cyan-400
  accentLight: '#67E8F9', // Cyan-300

  // Text - Light on dark
  text: '#F1F5F9', // Slate-100
  textSecondary: '#94A3B8', // Slate-400
  textTertiary: '#64748B', // Slate-500

  // Borders
  border: '#334155', // Slate-700
  divider: '#1E293B', // Slate-800

  // Status
  success: '#34D399', // Emerald-400
  successLight: '#064E3B', // Emerald-900
  warning: '#FBBF24', // Amber-400
  warningLight: '#78350F', // Amber-900
  error: '#F87171', // Red-400
  errorLight: '#7F1D1D', // Red-900
  info: '#60A5FA', // Blue-400
  infoLight: '#1E3A8A', // Blue-900

  // Task status
  taskOpen: '#FBBF24', // Amber-400
  taskOpenBg: '#78350F', // Amber-900
  taskDone: '#34D399', // Emerald-400
  taskDoneBg: '#064E3B', // Emerald-900
  taskCancelled: '#F87171', // Red-400
  taskCancelledBg: '#7F1D1D', // Red-900

  // Interactive
  buttonPrimary: '#818CF8',
  buttonPrimaryText: '#0F172A',
  buttonSecondary: '#334155',
  buttonSecondaryText: '#F1F5F9',

  // Effects
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.7)',

  // Navbar
  navbar: '#1E293B',
  navbarText: '#94A3B8',
  navbarActive: '#818CF8',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const { setColorScheme } = useNativeWindColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isReady, setIsReady] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (
        savedTheme &&
        (savedTheme === 'light' ||
          savedTheme === 'dark' ||
          savedTheme === 'system')
      ) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    } finally {
      setIsReady(true);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Determine actual theme to use
  const isDark =
    themeMode === 'dark' ||
    (themeMode === 'system' && systemColorScheme === 'dark');

  const theme: Theme = {
    mode: themeMode,
    isDark,
    colors: isDark ? darkTheme : lightTheme,
  };

  // Sync with NativeWind colorScheme
  useEffect(() => {
    if (isReady) {
      setColorScheme(isDark ? 'dark' : 'light');
    }
  }, [isDark, isReady, setColorScheme]);

  // Don't render until theme is loaded
  if (!isReady) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
