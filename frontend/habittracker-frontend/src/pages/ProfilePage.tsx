import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '../api/profileApi';
import { ApiClientError } from '../api/client';
import type { ThemeMode } from '../types';
import { applyThemeMode, normalizeThemeMode } from '../styles/theme';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../hooks/useAuth';
import '../components/profile/profile-ui.css';

type SelectableThemeMode = Exclude<ThemeMode, 'SYSTEM'>;

const themeOptions: SelectableThemeMode[] = ['LIGHT', 'DARK'];
const AVATAR_MAX_SIZE_BYTES = 2 * 1024 * 1024;
const CURRENT_AVATAR_STORAGE_KEY = 'habittracker-avatar:current';
const AVATAR_UPDATED_EVENT = 'habittracker:avatar-updated';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profileId, setProfileId] = useState<string>('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [themeMode, setThemeMode] = useState<SelectableThemeMode>('LIGHT');
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getAvatarStorageKey = (id: string) => `habittracker-avatar:${id}`;

  const syncCurrentAvatar = (avatar: string | null) => {
    if (avatar) {
      localStorage.setItem(CURRENT_AVATAR_STORAGE_KEY, avatar);
    } else {
      localStorage.removeItem(CURRENT_AVATAR_STORAGE_KEY);
    }

    window.dispatchEvent(new Event(AVATAR_UPDATED_EVENT));
  };

  const initials = `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.trim() || username.slice(0, 2).toUpperCase() || 'U';

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const profile = await profileApi.getProfile();
        setProfileId(profile.id);
        setEmail(profile.email);
        setUsername(profile.username);
        setFirstName(profile.firstName);
        setLastName(profile.lastName);
        const normalizedThemeMode = normalizeThemeMode(profile.themeMode);
        setThemeMode(normalizedThemeMode);
        applyThemeMode(normalizedThemeMode);
        setEmailNotifications(profile.emailNotifications);
        setPushNotifications(profile.pushNotifications);

        const storedAvatar = localStorage.getItem(getAvatarStorageKey(profile.id));
        setAvatarDataUrl(storedAvatar);
        syncCurrentAvatar(storedAvatar);
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const updatedProfile = await profileApi.updateProfile({
        firstName,
        lastName,
        themeMode,
        emailNotifications,
        pushNotifications,
      });

      const normalizedThemeMode = normalizeThemeMode(updatedProfile.themeMode);
      setThemeMode(normalizedThemeMode);
      applyThemeMode(normalizedThemeMode);
      setSuccessMessage('Profile updated.');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null);
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please choose an image file.');
      event.target.value = '';
      return;
    }

    if (file.size > AVATAR_MAX_SIZE_BYTES) {
      setAvatarError('Image is too large. Max size is 2 MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      setAvatarDataUrl(result);
      if (result && profileId) {
        localStorage.setItem(getAvatarStorageKey(profileId), result);
      }
      syncCurrentAvatar(result);
    };
    reader.onerror = () => {
      setAvatarError('Failed to read image. Try another file.');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const removeAvatar = () => {
    setAvatarDataUrl(null);
    setAvatarError(null);
    if (profileId) {
      localStorage.removeItem(getAvatarStorageKey(profileId));
    }
    syncCurrentAvatar(null);
  };

  const onLogout = () => {
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  if (isLoading) {
    return (
      <section className="profile-page">
        <div className="profile-shell">
          <p className="profile-loading">Loading profile...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="profile-page">
      <div className="profile-shell">
        <header className="profile-header">
          <div>
            <h1 className="profile-header__title">Profile</h1>
            <p className="profile-header__subtitle">Manage your account details, preferences, and profile photo.</p>
          </div>
        </header>

        <div className="profile-grid">
          <aside className="profile-card profile-card--summary">
            <div className="profile-avatar-wrap">
              {avatarDataUrl ? (
                <img src={avatarDataUrl} alt="Profile" className="profile-avatar" />
              ) : (
                <div className="profile-avatar profile-avatar--fallback" aria-hidden="true">
                  {initials.toUpperCase()}
                </div>
              )}
            </div>

            <div className="profile-identity">
              <h2 className="profile-identity__name">{firstName} {lastName}</h2>
              <p className="profile-identity__username">@{username}</p>
              <p className="profile-identity__email">{email}</p>
            </div>

            <label className="profile-upload-button">
              Upload photo
              <input type="file" accept="image/*" onChange={onAvatarChange} />
            </label>
            {avatarDataUrl ? (
              <button type="button" className="profile-remove-button" onClick={removeAvatar}>
                Remove photo
              </button>
            ) : null}
            <button type="button" className="profile-logout-button" onClick={onLogout}>
              Logout
            </button>
            <p className="profile-upload-note">JPG/PNG/WebP, max 2 MB. Stored locally on this device.</p>
            {avatarError ? <p className="profile-message profile-message--error">{avatarError}</p> : null}
          </aside>

          <form onSubmit={onSubmit} className="profile-card profile-form">
            <div className="profile-form-grid">
              <label className="profile-field">
                <span className="profile-field__label">First name</span>
                <input
                  className="profile-field__input"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                />
              </label>

              <label className="profile-field">
                <span className="profile-field__label">Last name</span>
                <input
                  className="profile-field__input"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                />
              </label>

              <label className="profile-field profile-field--full">
                <span className="profile-field__label">Theme mode</span>
                <select
                  className="profile-field__input"
                  value={themeMode}
                  onChange={(event) => {
                    const selectedThemeMode = event.target.value as SelectableThemeMode;
                    setThemeMode(selectedThemeMode);
                    applyThemeMode(selectedThemeMode);
                  }}
                >
                  {themeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="profile-toggles">
              <label className="profile-toggle">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(event) => setEmailNotifications(event.target.checked)}
                />
                <span>Email notifications</span>
              </label>

              <label className="profile-toggle">
                <input
                  type="checkbox"
                  checked={pushNotifications}
                  onChange={(event) => setPushNotifications(event.target.checked)}
                />
                <span>Push notifications</span>
              </label>
            </div>

            {error ? <p className="profile-message profile-message--error">{error}</p> : null}
            {successMessage ? <p className="profile-message profile-message--success">{successMessage}</p> : null}

            <div className="profile-actions">
              <button type="submit" disabled={isSubmitting} className="profile-save-button">
                {isSubmitting ? 'Saving...' : 'Save profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
