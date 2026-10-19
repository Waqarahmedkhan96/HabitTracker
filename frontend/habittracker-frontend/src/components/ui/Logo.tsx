import { useId } from 'react';

interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}

export default function Logo({ size = 36, withWordmark = false, className }: LogoProps) {
  const gradientId = useId();

  return (
    <span className={`logo${className ? ` ${className}` : ''}`}>
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="logo__mark">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4f73ff" />
            <stop offset="1" stopColor="#2443c6" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill={`url(#${gradientId})`} />
        <circle cx="32" cy="32" r="17" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth="4.5" />
        <path className="logo__arc" d="M32 15a17 17 0 0 1 16.2 22.2" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
        <path className="logo__check" d="M24.5 32.5l5.2 5.2 10-10.4" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {withWordmark ? (
        <span className="logo__wordmark">
          Habit<span>Tracker</span>
        </span>
      ) : null}
    </span>
  );
}
