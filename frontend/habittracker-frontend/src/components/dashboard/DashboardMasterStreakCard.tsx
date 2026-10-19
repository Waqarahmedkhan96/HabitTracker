import Icon from '../ui/Icon';

interface DashboardMasterStreakCardProps {
  masterStreak: number;
}

export default function DashboardMasterStreakCard({ masterStreak }: DashboardMasterStreakCardProps) {
  const isActive = masterStreak > 0;

  return (
    <aside
      className={`master-streak${isActive ? ' master-streak--active' : ''}`}
      aria-label={`Master streak: ${masterStreak} ${masterStreak === 1 ? 'day' : 'days'}`}
      title="Consecutive perfect days, where no scheduled habit was missed."
    >
      <span className="master-streak__flame" aria-hidden="true">
        <Icon name="flame" size={22} strokeWidth={2} />
      </span>
      <span className="master-streak__meta">
        <span className="master-streak__label">Master streak</span>
        <span className="master-streak__value tabular">
          {masterStreak} <small>{masterStreak === 1 ? 'day' : 'days'}</small>
        </span>
      </span>
    </aside>
  );
}
