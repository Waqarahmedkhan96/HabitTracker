import Icon, { type IconName } from '../ui/Icon';

interface DashboardStatCardProps {
  label: string;
  value: string;
  detail?: string;
  icon: IconName;
  tone?: 'accent' | 'success' | 'danger' | 'warning';
  index?: number;
}

export default function DashboardStatCard({ label, value, detail, icon, tone = 'accent', index = 0 }: DashboardStatCardProps) {
  return (
    <article className={`stat-card stat-card--${tone}`} style={{ ['--i' as string]: index }}>
      <div className="stat-card__top">
        <p className="stat-card__label">{label}</p>
        <span className="stat-card__icon">
          <Icon name={icon} size={17} />
        </span>
      </div>
      <p className="stat-card__value tabular">{value}</p>
      {detail ? <p className="stat-card__detail">{detail}</p> : null}
    </article>
  );
}
