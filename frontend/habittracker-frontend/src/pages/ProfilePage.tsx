import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { profileApi } from '../api/profileApi';
import { ApiClientError } from '../api/client';
import type { ThemeMode } from '../types';

const themeOptions: ThemeMode[] = ['LIGHT', 'DARK', 'SYSTEM'];

export default function ProfilePage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [themeMode, setThemeMode] = useState<ThemeMode>('SYSTEM');
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const profile = await profileApi.getProfile();
        setEmail(profile.email);
        setUsername(profile.username);
        setFirstName(profile.firstName);
        setLastName(profile.lastName);
        setThemeMode(profile.themeMode);
        setEmailNotifications(profile.emailNotifications);
        setPushNotifications(profile.pushNotifications);
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
    setIsSubmitting(true);

    try {
      await profileApi.updateProfile({
        firstName,
        lastName,
        themeMode,
        emailNotifications,
        pushNotifications,
      });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <p>Loading profile...</p>;
  }

  return (
    <section>
      <h1>Profile</h1>
      <p>Email: {email}</p>
      <p>Username: {username}</p>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.75rem', maxWidth: 420 }}>
        <label>
          First name
          <input value={firstName} onChange={(event) => setFirstName(event.target.value)} />
        </label>

        <label>
          Last name
          <input value={lastName} onChange={(event) => setLastName(event.target.value)} />
        </label>

        <label>
          Theme mode
          <select value={themeMode} onChange={(event) => setThemeMode(event.target.value as ThemeMode)}>
            {themeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={(event) => setEmailNotifications(event.target.checked)}
          />
          Email notifications
        </label>

        <label>
          <input
            type="checkbox"
            checked={pushNotifications}
            onChange={(event) => setPushNotifications(event.target.checked)}
          />
          Push notifications
        </label>

        {error && <p style={{ color: '#b91c1c' }}>{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save profile'}
        </button>
      </form>
    </section>
  );
}
