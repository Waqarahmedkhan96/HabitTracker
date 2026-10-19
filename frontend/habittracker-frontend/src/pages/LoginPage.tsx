import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { ApiClientError, IS_DEMO_MODE } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../components/auth/AuthLayout';
import PasswordInput from '../components/auth/PasswordInput';
import Icon from '../components/ui/Icon';
import Spinner from '../components/ui/Spinner';

interface LocationState {
  from?: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [emailOrUsername, setEmailOrUsername] = useState(IS_DEMO_MODE ? 'alexmorgan' : '');
  const [password, setPassword] = useState(IS_DEMO_MODE ? 'demo-password' : '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = (location.state as LocationState | null)?.from ?? ROUTES.APP_HOME;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ emailOrUsername: emailOrUsername.trim(), password });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiClientError && err.status === 401
          ? 'That email, username or password is not right.'
          : err instanceof ApiClientError
            ? err.message
            : 'Sign in failed. Please try again.',
      );
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Sign in to your account"
      subtitle="Pick up where you left off and keep your streaks alive."
      footer={
        <>
          New to Habit Tracker?{' '}
          <Link to={ROUTES.REGISTER} className="auth-card__link">
            Create an account
          </Link>
        </>
      }
    >
      {IS_DEMO_MODE ? (
        <div className="auth-demo-note">
          <Icon name="sparkles" size={16} />
          <span>
            <strong>Demo mode.</strong> Sign in with any details to explore sample data.
          </span>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="auth-form" noValidate={false}>
        <label className="field">
          <span className="field__label">Email or username</span>
          <div className="input-group">
            <Icon name="user" size={17} className="auth-input-icon" />
            <input
              required
              autoFocus
              value={emailOrUsername}
              onChange={(event) => setEmailOrUsername(event.target.value)}
              className="input auth-input"
              autoComplete="username"
              placeholder="you@example.com"
            />
          </div>
        </label>

        <label className="field">
          <span className="field__label">Password</span>
          <PasswordInput
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="Your password"
          />
        </label>

        {error ? (
          <p className="alert alert--error" role="alert">
            <Icon name="alert" size={17} />
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={isSubmitting} className="btn btn--primary btn--lg btn--block">
          {isSubmitting ? (
            <>
              <Spinner /> Signing in…
            </>
          ) : (
            <>
              Sign in <Icon name="arrow-right" size={17} />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
