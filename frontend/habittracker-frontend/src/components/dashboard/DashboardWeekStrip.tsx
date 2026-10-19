import type { HabitEntryStatus } from '../../types';

export interface DashboardWeekDay {
  label: string;
  dateLabel: string;
  status: HabitEntryStatus | 'EMPTY' | 'UNSCHEDULED';
  isToday: boolean;
  isFuture: boolean;
}

interface DashboardWeekStripProps {
  days: DashboardWeekDay[];
}

const statusLabel: Record<DashboardWeekDay['status'], string> = {
  COMPLETED: 'Completed',
  PARTIAL: 'Partial',
  MISSED: 'Missed',
  EMPTY: 'No entry',
  UNSCHEDULED: 'Not scheduled',
};

export default function DashboardWeekStrip({ days }: DashboardWeekStripProps) {
  return (
    <div className="week-strip" aria-label="This week">
      {days.map((day) => (
        <span
          key={day.dateLabel}
          className={`week-strip__day week-strip__day--${day.status.toLowerCase()}${day.isToday ? ' week-strip__day--today' : ''}${
            day.isFuture ? ' week-strip__day--future' : ''
          }`}
          title={`${day.label} ${day.dateLabel}: ${day.isFuture ? 'Upcoming' : statusLabel[day.status]}`}
        >
          <span className="week-strip__label">{day.label.charAt(0)}</span>
          <span className="week-strip__dot" aria-hidden="true" />
        </span>
      ))}
    </div>
  );
}
