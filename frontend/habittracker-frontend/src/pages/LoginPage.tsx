import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { ApiClientError } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import '../components/auth/auth-ui.css';

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
    <section className="auth-page">
      <div className="auth-card">
        <header className="auth-card__header">
          <p className="auth-card__eyebrow">Welcome back</p>
          <h1 className="auth-card__title">Login</h1>
          <p className="auth-card__subtitle">Track your habits, keep streaks alive, and log today in seconds.</p>
        </header>

        <form onSubmit={onSubmit} className="auth-form">
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

          <button type="submit" disabled={isSubmitting} className="auth-form__submit">
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
    </section>
  );
}
