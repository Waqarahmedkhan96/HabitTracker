import { useEffect, useState } from 'react';
import { getCurrentThemeMode, subscribeToThemeChanges, type AppThemeMode } from '../styles/theme';

export const useThemeMode = (): AppThemeMode => {
  const [mode, setMode] = useState<AppThemeMode>(getCurrentThemeMode);

  useEffect(() => subscribeToThemeChanges(setMode), []);

  return mode;
};
