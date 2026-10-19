import { useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import Icon from '../ui/Icon';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export default function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="input-group">
      <Icon name="lock" size={17} className="auth-input-icon" />
      <input {...props} type={isVisible ? 'text' : 'password'} className={`input auth-input${className ? ` ${className}` : ''}`} />
      <button
        type="button"
        className="icon-button input-group__suffix"
        onClick={() => setIsVisible((value) => !value)}
        aria-label={isVisible ? 'Hide password' : 'Show password'}
        aria-pressed={isVisible}
      >
        <Icon name={isVisible ? 'eye-off' : 'eye'} size={17} />
      </button>
    </div>
  );
}
