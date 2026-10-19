import type { ReactNode } from 'react';
import Icon from '../ui/Icon';
import Logo from '../ui/Logo';
import ProgressRing from '../ui/ProgressRing';
import ThemeSwitcher from '../ui/ThemeSwitcher';
import './auth-ui.css';

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

const weekPreview = [
  { day: 'M', status: 'completed' },
  { day: 'T', status: 'completed' },
  { day: 'W', status: 'partial' },
  { day: 'T', status: 'completed' },
  { day: 'F', status: 'completed' },
  { day: 'S', status: 'completed' },
  { day: 'S', status: 'empty' },
];

export default function AuthLayout({ eyebrow, title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="auth-page">
      <aside className="auth-showcase" aria-hidden="true">
        <div className="auth-showcase__grid" />
        <div className="auth-showcase__orb auth-showcase__orb--one" />
        <div className="auth-showcase__orb auth-showcase__orb--two" />

        <div className="auth-showcase__brand">
          <Logo size={40} />
          <span>Habit Tracker</span>
        </div>

        <div className="auth-showcase__stage">
          <div className="auth-float auth-float--ring">
            <ProgressRing value={83} size={112} strokeWidth={10} tone="success">
              <span className="auth-float__ring-value">83%</span>
              <span className="auth-float__ring-label">today</span>
            </ProgressRing>
          </div>

          <div className="auth-float auth-float--streak">
            <span className="auth-float__icon">
              <Icon name="flame" size={20} />
            </span>
            <div>
              <p className="auth-float__value">21 days</p>
              <p className="auth-float__label">Current streak</p>
            </div>
          </div>

          <div className="auth-float auth-float--week">
            <p className="auth-float__title">Morning walk</p>
            <div className="auth-float__week">
              {weekPreview.map((item, index) => (
                <span key={index} className={`auth-float__day auth-float__day--${item.status}`}>
                  <span>{item.day}</span>
                  <i />
                </span>
              ))}
            </div>
          </div>

          <div className="auth-float auth-float--toast">
            <span className="auth-float__check">
              <Icon name="check" size={14} strokeWidth={2.6} />
            </span>
            Read 20 pages · logged
          </div>
        </div>

        <div className="auth-showcase__copy">
          <h2>Small steps, every single day.</h2>
          <p>Build routines that stick with streaks, gentle check-ins and insights that show how far you have come.</p>
        </div>
      </aside>

      <main className="auth-panel">
        <div className="auth-panel__top">
          <span className="auth-panel__mobile-logo">
            <Logo size={32} withWordmark />
          </span>
          <ThemeSwitcher persist={false} />
        </div>

        <div className="auth-card">
          <header className="auth-card__header">
            <p className="auth-card__eyebrow">{eyebrow}</p>
            <h1 className="auth-card__title">{title}</h1>
            <p className="auth-card__subtitle">{subtitle}</p>
          </header>
          {children}
          <p className="auth-card__footer">{footer}</p>
        </div>

        <p className="auth-panel__legal">© {new Date().getFullYear()} Habit Tracker</p>
      </main>
    </div>
  );
}
