import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { profileApi } from '../../api/profileApi';
import { useAuth } from '../../hooks/useAuth';
import { useConfirm } from '../../hooks/useFeedback';
import Icon, { type IconName } from '../ui/Icon';
import Logo from '../ui/Logo';
import ThemeSwitcher from '../ui/ThemeSwitcher';
import './layout.css';

const navItems: Array<{ to: string; label: string; icon: IconName; end?: boolean }> = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: 'dashboard' },
  { to: ROUTES.HABITS, label: 'Habits', icon: 'habits' },
  { to: ROUTES.STATS, label: 'Statistics', icon: 'chart' },
  { to: ROUTES.CATEGORIES, label: 'Categories', icon: 'folder' },
];

const pageTitles: Array<[RegExp, string]> = [
  [/^\/dashboard/, 'Dashboard'],
  [/^\/habits\/new$/, 'New habit'],
  [/^\/habits\/[^/]+\/edit$/, 'Edit habit'],
  [/^\/habits\/[^/]+$/, 'Habit details'],
  [/^\/habits/, 'Habits'],
  [/^\/stats/, 'Statistics'],
  [/^\/categories/, 'Categories'],
  [/^\/profile/, 'Profile'],
];

const CURRENT_AVATAR_STORAGE_KEY = 'habittracker-avatar:current';
const AVATAR_UPDATED_EVENT = 'habittracker:avatar-updated';
const getAvatarStorageKey = (id: string) => `habittracker-avatar:${id}`;

const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const confirm = useConfirm();
  const location = useLocation();
  const navigate = useNavigate();
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(() => localStorage.getItem(CURRENT_AVATAR_STORAGE_KEY));
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [lastPath, setLastPath] = useState(location.pathname);

  // Close the mobile drawer whenever the route changes.
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setIsNavOpen(false);
  }

  const username = user?.username ?? 'User';
  const initials =
    username
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((value) => value.charAt(0).toUpperCase())
      .join('') || 'U';

  useEffect(() => {
    const match = pageTitles.find(([pattern]) => pattern.test(location.pathname));
    document.title = match ? `${match[1]} · Habit Tracker` : 'Habit Tracker';
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  useEffect(() => {
    let isDisposed = false;

    const loadAvatar = async () => {
      try {
        const profile = await profileApi.getProfile();
        if (isDisposed) {
          return;
        }
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

    return () => {
      isDisposed = true;
    };
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) {
        return;
      }
      if (event.key === 'Escape') {
        setIsNavOpen(false);
      }
      if (event.key.toLowerCase() === 'n' && !document.querySelector('.modal')) {
        event.preventDefault();
        navigate(ROUTES.CREATE_HABIT);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate]);

  const onLogout = async () => {
    const confirmed = await confirm({
      title: 'Sign out?',
      description: 'You will need to sign in again to keep tracking your habits.',
      confirmLabel: 'Sign out',
    });
    if (confirmed) {
      logout();
      navigate(ROUTES.LOGIN, { replace: true });
    }
  };

  return (
    <div className={`app-shell${isNavOpen ? ' app-shell--nav-open' : ''}`}>
      <header className="app-topbar">
        <button
          type="button"
          className="icon-button"
          onClick={() => setIsNavOpen(true)}
          aria-label="Open navigation"
          aria-expanded={isNavOpen}
          aria-controls="app-sidebar"
        >
          <Icon name="menu" size={20} />
        </button>
        <Link to={ROUTES.DASHBOARD} className="app-topbar__brand" aria-label="Habit Tracker home">
          <Logo size={30} withWordmark />
        </Link>
        <Link to={ROUTES.CREATE_HABIT} className="icon-button icon-button--bordered" aria-label="Create habit">
          <Icon name="plus" size={18} />
        </Link>
      </header>

      <div className="app-sidebar__scrim" onClick={() => setIsNavOpen(false)} aria-hidden="true" />

      <aside id="app-sidebar" className="app-sidebar" aria-label="Main navigation">
        <div className="app-sidebar__head">
          <Link to={ROUTES.DASHBOARD} className="app-sidebar__brand" aria-label="Habit Tracker home">
            <Logo size={34} withWordmark />
          </Link>
          <button type="button" className="icon-button app-sidebar__close" onClick={() => setIsNavOpen(false)} aria-label="Close navigation">
            <Icon name="x" />
          </button>
        </div>

        <Link to={ROUTES.CREATE_HABIT} className="btn btn--primary btn--block app-sidebar__cta">
          <Icon name="plus" size={17} strokeWidth={2.2} />
          New habit
          <span className="kbd app-sidebar__kbd" aria-hidden="true">
            N
          </span>
        </Link>

        <nav className="app-nav">
          <p className="app-nav__heading">Menu</p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `app-nav__link${isActive ? ' app-nav__link--active' : ''}`}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="app-sidebar__footer">
          <div className="app-sidebar__theme">
            <span className="app-sidebar__theme-label">Appearance</span>
            <ThemeSwitcher />
          </div>

          <div className="app-user">
            <NavLink
              to={ROUTES.PROFILE}
              className={({ isActive }) => `app-user__link${isActive ? ' app-user__link--active' : ''}`}
            >
              {avatarDataUrl ? (
                <img src={avatarDataUrl} alt="" className="app-user__avatar" />
              ) : (
                <span className="app-user__avatar app-user__avatar--fallback" aria-hidden="true">
                  {initials}
                </span>
              )}
              <span className="app-user__text">
                <span className="app-user__name">{username}</span>
                <span className="app-user__meta">Account settings</span>
              </span>
            </NavLink>
            <button type="button" className="icon-button" onClick={() => void onLogout()} aria-label="Sign out" title="Sign out">
              <Icon name="logout" size={18} />
            </button>
          </div>
        </div>
      </aside>

      <main className="app-main">
        <div key={location.pathname} className="app-main__inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
