interface DashboardMasterStreakCardProps {
  masterStreak: number;
}

function toDayLabel(masterStreak: number): string {
  return `${masterStreak} ${masterStreak === 1 ? 'day' : 'days'}`;
}

export default function DashboardMasterStreakCard({ masterStreak }: DashboardMasterStreakCardProps) {
  return (
    <aside
      className="dashboard-master-streak-badge"
      aria-label="Master streak"
      title="A perfect day means no scheduled habit was missed."
    >
      <span className="dashboard-master-streak-badge__flame" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M12 2.4c1.2 2 1.2 4.6-.1 6.7-.9 1.4-.6 2.6.7 3.5 2.5 1.8 3.7 3.9 3.7 6.2 0 3.2-2.5 5.7-5.8 5.7S4.4 22 4.4 18.8c0-2 1-3.8 3.1-5.5 2.3-2 3.7-4.6 4.5-7.8z" />
          <path d="M12.3 11.2c.3 1.2-.1 2.3-1.1 3.2-.8.7-1.2 1.4-1.2 2.2 0 1.2 1 2.1 2.2 2.1s2.2-.9 2.2-2.1c0-.9-.5-1.8-1.5-2.7-.7-.6-.9-1.5-.6-2.7z" />
        </svg>
      </span>
      <span className="dashboard-master-streak-badge__meta">
        <span className="dashboard-master-streak-badge__label">Master Streak</span>
        <span className="dashboard-master-streak-badge__value">{toDayLabel(masterStreak)}</span>
      </span>
    </aside>
  );
}