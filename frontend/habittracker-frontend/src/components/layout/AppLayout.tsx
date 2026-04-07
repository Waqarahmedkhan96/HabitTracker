import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { profileApi } from '../../api/profileApi';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard' },
  { to: ROUTES.HABITS, label: 'Habits' },
];

const CURRENT_AVATAR_STORAGE_KEY = 'habittracker-avatar:current';
const AVATAR_UPDATED_EVENT = 'habittracker:avatar-updated';
const getAvatarStorageKey = (id: string) => `habittracker-avatar:${id}`;

export default function AppLayout() {
  const { user } = useAuth();
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(() => localStorage.getItem(CURRENT_AVATAR_STORAGE_KEY));
  const username = user?.username ?? 'User';
  const initials = username
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((value) => value.charAt(0).toUpperCase())
    .join('') || 'U';

  useEffect(() => {
    const loadAvatar = async () => {
      try {
        const profile = await profileApi.getProfile();
        const storedAvatar = localStorage.getItem(getAvatarStorageKey(profile.id));
        setAvatarDataUrl(storedAvatar);

        if (storedAvatar) {
          localStorage.setItem(CURRENT_AVATAR_STORAGE_KEY, storedAvatar);
        } else {
          localStorage.removeItem(CURRENT_AVATAR_STORAGE_KEY);
        }
      } catch {
        // Keep current value if avatar cannot be resolved.
      }
    };

    void loadAvatar();
  }, []);

  useEffect(() => {
    const syncCurrentAvatar = () => {
      setAvatarDataUrl(localStorage.getItem(CURRENT_AVATAR_STORAGE_KEY));
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === CURRENT_AVATAR_STORAGE_KEY) {
        setAvatarDataUrl(event.newValue);
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(AVATAR_UPDATED_EVENT, syncCurrentAvatar);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(AVATAR_UPDATED_EVENT, syncCurrentAvatar);
    };
  }, []);

  return (
    <div style={{ display: 'grid', minHeight: '100vh', gridTemplateColumns: '220px 1fr' }}>
      <aside
        style={{
          borderRight: '1px solid var(--border-color)',
          padding: '1rem',
          background: 'var(--surface-1)',
          color: 'var(--text-primary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div>
          <div
            aria-hidden="true"
            style={{
              height: 34,
              marginBottom: 6,
            }}
          />
          <h2 style={{ margin: 0, fontSize: '1.52rem', letterSpacing: '-0.025em', lineHeight: 1.08 }}>Habit Tracker</h2>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            {user?.username}
          </p>
        </div>

        <nav style={{ display: 'grid', gap: '0.62rem', marginTop: '0.45rem' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                padding: '0.72rem 0.9rem',
                borderRadius: 11,
                textDecoration: 'none',
                background: isActive ? 'var(--accent-soft)' : 'transparent',
                color: isActive ? 'var(--accent-strong)' : 'var(--text-primary)',
                border: `1px solid ${isActive ? 'var(--border-strong)' : 'transparent'}`,
                fontWeight: 600,
                fontSize: '1.01rem',
                lineHeight: 1.2,
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <NavLink
          to={ROUTES.PROFILE}
          style={{
            marginTop: 'auto',
            display: 'grid',
            gridTemplateColumns: '2rem 1fr',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.62rem 0.75rem',
            borderRadius: 10,
            border: '1px solid var(--border-strong)',
            background: 'var(--surface-1)',
            color: 'var(--text-primary)',
            textDecoration: 'none',
          }}
        >
          {avatarDataUrl ? (
            <img
              src={avatarDataUrl}
              alt="User avatar"
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: 999,
                objectFit: 'cover',
                border: '1px solid var(--border-strong)',
              }}
            />
          ) : (
            <span
              aria-hidden="true"
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.82rem',
                fontWeight: 700,
                background: 'var(--accent-soft)',
                color: 'var(--accent-strong)',
              }}
            >
              {initials}
            </span>
          )}
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {username}
            </span>
            <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.76rem' }}>
              Account & settings
            </span>
          </span>
        </NavLink>
      </aside>

      <main style={{ padding: '1.25rem' }}>
        <Outlet />
      </main>
    </div>
  );
}
