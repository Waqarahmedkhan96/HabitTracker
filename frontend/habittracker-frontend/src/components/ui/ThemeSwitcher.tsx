import { profileApi } from '../../api/profileApi';
import { useThemeMode } from '../../hooks/useThemeMode';
import { applyThemeMode, type AppThemeMode } from '../../styles/theme';
import Icon, { type IconName } from './Icon';

const options: Array<{ value: AppThemeMode; label: string; icon: IconName }> = [
  { value: 'LIGHT', label: 'Light', icon: 'sun' },
  { value: 'DARK', label: 'Dark', icon: 'moon' },
  { value: 'SYSTEM', label: 'System', icon: 'monitor' },
];

interface ThemeSwitcherProps {
  persist?: boolean;
  showLabels?: boolean;
}

export default function ThemeSwitcher({ persist = true, showLabels = false }: ThemeSwitcherProps) {
  const mode = useThemeMode();

  const select = (next: AppThemeMode) => {
    if (next === mode) {
      return;
    }
    applyThemeMode(next, { animate: true });
    if (persist) {
      // Saving the preference is best effort; the local choice already applies.
      void profileApi.updateProfile({ themeMode: next }).catch(() => undefined);
    }
  };

  return (
    <div className={`segmented theme-switcher${showLabels ? ' theme-switcher--labels' : ''}`} role="radiogroup" aria-label="Color theme">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={mode === option.value}
          className="segmented__option"
          onClick={() => select(option.value)}
          title={`${option.label} theme`}
        >
          <Icon name={option.icon} size={15} />
          <span className={showLabels ? undefined : 'sr-only'}>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
