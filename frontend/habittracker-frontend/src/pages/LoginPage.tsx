import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { ApiClientError } from '../api/client';
import { useAuth } from '../hooks/useAuth';

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
    <section>
      <h1>Login</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.75rem', maxWidth: 360 }}>
        <label>
          Email or username
          <input
            required
            value={emailOrUsername}
            onChange={(event) => setEmailOrUsername(event.target.value)}
            style={{ display: 'block', width: '100%', marginTop: 4 }}
          />
        </label>

        <label>
          Password
          <input
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={{ display: 'block', width: '100%', marginTop: 4 }}
          />
        </label>

        {error && <p style={{ color: '#b91c1c' }}>{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p>
        Need an account? <Link to={ROUTES.REGISTER}>Register</Link>
      </p>
    </section>
  );
}
