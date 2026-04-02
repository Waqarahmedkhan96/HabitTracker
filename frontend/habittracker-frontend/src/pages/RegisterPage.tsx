import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { ApiClientError } from '../api/client';
import { useAuth } from '../hooks/useAuth';

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

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
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
    <section>
      <h1>Register</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.75rem', maxWidth: 420 }}>
        <label>
          Email
          <input
            required
            type="email"
            value={formData.email}
            onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
            style={{ display: 'block', width: '100%', marginTop: 4 }}
          />
        </label>

        <label>
          Username
          <input
            required
            value={formData.username}
            onChange={(event) => setFormData((prev) => ({ ...prev, username: event.target.value }))}
            style={{ display: 'block', width: '100%', marginTop: 4 }}
          />
        </label>

        <label>
          Password
          <input
            required
            type="password"
            minLength={6}
            value={formData.password}
            onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
            style={{ display: 'block', width: '100%', marginTop: 4 }}
          />
        </label>

        <label>
          First name
          <input
            required
            value={formData.firstName}
            onChange={(event) => setFormData((prev) => ({ ...prev, firstName: event.target.value }))}
            style={{ display: 'block', width: '100%', marginTop: 4 }}
          />
        </label>

        <label>
          Last name
          <input
            required
            value={formData.lastName}
            onChange={(event) => setFormData((prev) => ({ ...prev, lastName: event.target.value }))}
            style={{ display: 'block', width: '100%', marginTop: 4 }}
          />
        </label>

        {error && <p style={{ color: '#b91c1c' }}>{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p>
        Already registered? <Link to={ROUTES.LOGIN}>Login</Link>
      </p>
    </section>
  );
}
