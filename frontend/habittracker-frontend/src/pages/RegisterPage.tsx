import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { ApiClientError } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../components/auth/AuthLayout';
import PasswordInput from '../components/auth/PasswordInput';
import Icon from '../components/ui/Icon';
import Spinner from '../components/ui/Spinner';

const MIN_PASSWORD_LENGTH = 8;

const strengthLabels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'] as const;

function getPasswordStrength(password: string): number {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return 0;
  }

  let score = 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 14) score += 1;
  return Math.min(score, 4);
}

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

  const strength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);

  const update = (field: keyof typeof formData) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (formData.password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      return;
    }

    if (/\s/.test(formData.username)) {
      setError('Usernames cannot contain spaces.');
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        ...formData,
        email: formData.email.trim(),
        username: formData.username.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
      });
      navigate(ROUTES.APP_HOME, { replace: true });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Registration failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Create your account"
      subtitle="It takes less than a minute. Your first streak starts today."
      footer={
        <>
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN} className="auth-card__link">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="auth-form">
        <div className="auth-two-column">
          <label className="field">
            <span className="field__label">First name</span>
            <input
              required
              autoFocus
              value={formData.firstName}
              onChange={update('firstName')}
              className="input"
              autoComplete="given-name"
              placeholder="Alex"
            />
          </label>

          <label className="field">
            <span className="field__label">Last name</span>
            <input
              required
              value={formData.lastName}
              onChange={update('lastName')}
              className="input"
              autoComplete="family-name"
              placeholder="Morgan"
            />
          </label>
        </div>

        <label className="field">
          <span className="field__label">Email address</span>
          <div className="input-group">
            <Icon name="mail" size={17} className="auth-input-icon" />
            <input
              required
              type="email"
              value={formData.email}
              onChange={update('email')}
              className="input auth-input"
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>
        </label>

        <label className="field">
          <span className="field__label">Username</span>
          <div className="input-group">
            <Icon name="at-sign" size={17} className="auth-input-icon" />
            <input
              required
              value={formData.username}
              onChange={update('username')}
              className="input auth-input"
              autoComplete="username"
              placeholder="alexmorgan"
            />
          </div>
        </label>

        <div className="field">
          <label className="field__label" htmlFor="register-password">
            Password
          </label>
          <PasswordInput
            id="register-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={formData.password}
            onChange={update('password')}
            autoComplete="new-password"
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
          />
          <div className={`password-meter password-meter--${strength}`} aria-live="polite">
            <div className="password-meter__bars" aria-hidden="true">
              {[1, 2, 3, 4].map((level) => (
                <span key={level} className={strength >= level ? 'is-filled' : undefined} />
              ))}
            </div>
            <span className="password-meter__label">
              {formData.password ? strengthLabels[strength] : `Use ${MIN_PASSWORD_LENGTH}+ characters with a mix of letters and numbers`}
            </span>
          </div>
        </div>

        {error ? (
          <p className="alert alert--error" role="alert">
            <Icon name="alert" size={17} />
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={isSubmitting} className="btn btn--primary btn--lg btn--block">
          {isSubmitting ? (
            <>
              <Spinner /> Creating account…
            </>
          ) : (
            <>
              Create account <Icon name="arrow-right" size={17} />
            </>
          )}
        </button>

        <p className="auth-form__policy">By creating an account you agree to the Terms of Service and Privacy Policy.</p>
      </form>
    </AuthLayout>
  );
}
