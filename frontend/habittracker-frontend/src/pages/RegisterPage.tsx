import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { ApiClientError } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import '../components/auth/auth-ui.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordHint = useMemo(() => {
    if (formData.password.length === 0) {
      return 'Use at least 8 characters for a strong password.';
    }
    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    return '';
  }, [formData.password]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      await register(formData);
      navigate(ROUTES.APP_HOME, { replace: true });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card auth-card--register">
        <header className="auth-card__header">
          <p className="auth-card__eyebrow">Create account</p>
          <h1 className="auth-card__title">Sign up for Habit Tracker</h1>
          <p className="auth-card__subtitle">Use your email to create a secure account and start tracking habits today.</p>
        </header>

        <form onSubmit={onSubmit} className="auth-form auth-form--register">
          <div className="auth-two-column">
            <label className="auth-form__field">
              <span className="auth-form__label">First name</span>
              <input
                required
                value={formData.firstName}
                onChange={(event) => setFormData((prev) => ({ ...prev, firstName: event.target.value }))}
                className="auth-form__input"
                autoComplete="given-name"
              />
            </label>

            <label className="auth-form__field">
              <span className="auth-form__label">Last name</span>
              <input
                required
                value={formData.lastName}
                onChange={(event) => setFormData((prev) => ({ ...prev, lastName: event.target.value }))}
                className="auth-form__input"
                autoComplete="family-name"
              />
            </label>
          </div>

          <label className="auth-form__field">
            <span className="auth-form__label">Mobile number or email address</span>
            <input
              required
              type="email"
              value={formData.email}
              onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
              className="auth-form__input"
              autoComplete="email"
            />
          </label>

          <label className="auth-form__field">
            <span className="auth-form__label">Username</span>
            <input
              required
              value={formData.username}
              onChange={(event) => setFormData((prev) => ({ ...prev, username: event.target.value }))}
              className="auth-form__input"
              autoComplete="username"
            />
          </label>

          <label className="auth-form__field">
            <span className="auth-form__label">Password</span>
            <input
              required
              type="password"
              value={formData.password}
              onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
              className="auth-form__input"
              autoComplete="new-password"
            />
            <p className={`auth-form__hint ${passwordHint && formData.password.length < 8 ? 'auth-form__hint--error' : ''}`}>
              {passwordHint}
            </p>
          </label>

          {error ? <p className="auth-form__error">{error}</p> : null}

          <button type="submit" disabled={isSubmitting} className="auth-form__submit">
            {isSubmitting ? 'Creating account...' : 'Submit'}
          </button>
        </form>

        <p className="auth-form__policy">
          By signing up, you agree to our <strong>Terms</strong> and confirm that you have read our <strong>Privacy Policy</strong>.
        </p>

        <p className="auth-card__footer">
          Already registered?{' '}
          <Link to={ROUTES.LOGIN} className="auth-card__link">
            Login
          </Link>
        </p>
      </div>
    </section>
  );
}
