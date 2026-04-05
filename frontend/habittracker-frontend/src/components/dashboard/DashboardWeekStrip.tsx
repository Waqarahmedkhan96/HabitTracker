import type { HabitEntryStatus } from '../../types';

export interface DashboardWeekDay {
  label: string;
  dateLabel: string;
  status: HabitEntryStatus | 'EMPTY';
  isToday: boolean;
}

interface DashboardWeekStripProps {
  days: DashboardWeekDay[];
}

function getStatusLabel(status: DashboardWeekDay['status']) {
  if (status === 'COMPLETED') {
    return 'Completed';
  }

  if (status === 'PARTIAL') {
    return 'Partial';
  }

  if (status === 'MISSED') {
    return 'Missed';
  }

  return 'No entry';
}

export default function DashboardWeekStrip({ days }: DashboardWeekStripProps) {
  return (
    <div className="dashboard-week-strip" aria-label="Current week activity">
      {days.map((day) => (
        <div
          key={day.dateLabel}
          className={`dashboard-week-day dashboard-week-day--${day.status.toLowerCase()}${
            day.isToday ? ' dashboard-week-day--today' : ''
          }`}
          title={`${day.label} ${day.dateLabel}: ${getStatusLabel(day.status)}`}
        >
          <span className="dashboard-week-day__label">{day.label}</span>
          <span className="dashboard-week-day__dot" aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}