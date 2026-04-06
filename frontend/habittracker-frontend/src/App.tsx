import { useEffect } from 'react';
import { profileApi } from './api/profileApi';
import { useAuth } from './hooks/useAuth';
import AppRouter from "./routes";
import { applyThemeMode, getStoredThemeMode, normalizeThemeMode } from './styles/theme';

function App() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const storedThemeMode = getStoredThemeMode() ?? 'LIGHT';
    applyThemeMode(storedThemeMode);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isDisposed = false;

    const syncThemeFromProfile = async () => {
      try {
        const profile = await profileApi.getProfile();
        if (isDisposed) {
          return;
        }

        applyThemeMode(normalizeThemeMode(profile.themeMode));
      } catch {
        // Keep current theme if the profile request fails.
      }
    };

    void syncThemeFromProfile();

    return () => {
      isDisposed = true;
    };
  }, [isAuthenticated]);

  return <AppRouter />;
}

export default App;