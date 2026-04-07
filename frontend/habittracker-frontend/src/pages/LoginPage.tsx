import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { ApiClientError } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import '../components/auth/auth-ui.css';
import logoImage from '../assets/HabitTracker-logo.png';
import dashboardImage from '../assets/Habit tracker with progress indicators.png';
import phoneImage from '../assets/Smartphone habit tracker.png';

interface LocationState {
  from?: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const redirectTo = (location.state as LocationState | null)?.from ?? ROUTES.APP_HOME;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ emailOrUsername, password });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={`auth-page auth-page--${theme}`}>
      <div className="auth-split">
        <aside className="auth-panel auth-panel--hero">
          <div className="auth-panel__brand">
            <img src={logoImage} alt="Habit Tracker logo" className="auth-logo__image" />
            <div className="auth-logo__text-block">
              <span className="auth-logo__eyebrow">Habit Tracker</span>
              
            </div>
          </div>

          <div className="auth-hero-copy">
            <h1 className="auth-panel__title">Explore the things you love.</h1>
            <p className="auth-panel__text">
              Stay motivated with a clean habit experience that showcases progress, routines, and daily wins.
            </p>
          </div>

          <div className="auth-hero-stack">
            <div className="auth-hero-card auth-hero-card--back">
              <img src={dashboardImage} alt="Habit tracker dashboard preview" />
            </div>

            <div className="auth-hero-card auth-hero-card--middle">
              <img src={phoneImage} alt="Habit tracker mobile preview" />
            </div>

            <div className="auth-hero-card auth-hero-card--front">
              <div className="hero-badge">
                <span>Daily streak</span>
                <strong>8 days</strong>
              </div>
            </div>
          </div>
        </aside>

        <main className="auth-panel auth-panel--form">
          <div className="auth-form-panel">
            <div className="auth-panel__top">
              <div>
                <p className="auth-card__eyebrow">Welcome back</p>
                <h1 className="auth-card__title">Login</h1>
                <p className="auth-card__subtitle">
                  Track your habits, keep streaks alive, and log today in seconds.
                </p>
              </div>

              <div className="auth-settings">
                <button
                  type="button"
                  className="auth-settings__button"
                  onClick={() => setIsThemeMenuOpen((open) => !open)}
                  aria-expanded={isThemeMenuOpen}
                >
                  ⚙️
                </button>
                {isThemeMenuOpen ? (
                  <div className="auth-settings__menu">
                    <button
                      type="button"
                      className="auth-settings__menu-item"
                      onClick={() => {
                        setTheme('light');
                        setIsThemeMenuOpen(false);
                      }}
                    >
                      Light theme
                    </button>
                    <button
                      type="button"
                      className="auth-settings__menu-item"
                      onClick={() => {
                        setTheme('dark');
                        setIsThemeMenuOpen(false);
                      }}
                    >
                      Dark theme
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <form onSubmit={onSubmit} className="auth-form auth-form--wide">
              <label className="auth-form__field">
                <span className="auth-form__label">Email or username</span>
                <input
                  required
                  value={emailOrUsername}
                  onChange={(event) => setEmailOrUsername(event.target.value)}
                  className="auth-form__input"
                  autoComplete="username"
                />
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">Password</span>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="auth-form__input"
                  autoComplete="current-password"
                />
              </label>

              {error ? <p className="auth-form__error">{error}</p> : null}

              <button type="submit" disabled={isSubmitting} className="auth-form__submit auth-form__submit--big">
                {isSubmitting ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <p className="auth-card__footer">
              Need an account?{' '}
              <Link to={ROUTES.REGISTER} className="auth-card__link">
                Register
              </Link>
            </p>
          </div>
        </main>
      </div>
    </section>
  );
}
