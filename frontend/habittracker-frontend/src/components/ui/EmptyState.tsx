import type { ReactNode } from 'react';
import Icon, { type IconName } from './Icon';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  message?: ReactNode;
  action?: ReactNode;
  tone?: 'default' | 'danger' | 'success';
  compact?: boolean;
}

export default function EmptyState({ icon = 'sparkles', title, message, action, tone = 'default', compact }: EmptyStateProps) {
  return (
    <div className={`empty-state empty-state--${tone}${compact ? ' empty-state--compact' : ''}`} role={tone === 'danger' ? 'alert' : undefined}>
      <span className="empty-state__icon">
        <Icon name={icon} size={compact ? 20 : 24} />
      </span>
      <p className="empty-state__title">{title}</p>
      {message ? <p className="empty-state__message">{message}</p> : null}
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  );
}
