import { Link } from 'react-router-dom';
import type { HabitEntryResponse, HabitResponse } from '../../types';
import DashboardWeekStrip, { type DashboardWeekDay } from './DashboardWeekStrip';

interface DashboardHabitCardProps {
  habit: HabitResponse;
  todayEntry?: HabitEntryResponse;
  weekDays: DashboardWeekDay[];
}

function getTodayStatusLabel(entry?: HabitEntryResponse) {
  if (!entry) {
    return 'Not logged';
  }

  if (entry.status === 'COMPLETED') {
    return 'Completed';
  }

  if (entry.status === 'PARTIAL') {
    return 'Partial';
  }

  return 'Missed';
}

function formatFrequencyLabel(habit: HabitResponse) {
  if (habit.frequencyType === 'DAILY') {
    return 'Daily';
  }

  if (!habit.selectedDaysCsv) {
    return 'Selected days';
  }

  const days = habit.selectedDaysCsv
    .split(',')
    .map((part) => part.trim().slice(0, 3).toUpperCase())
    .filter(Boolean);

  return days.length > 0 ? `Selected days · ${days.join(', ')}` : 'Selected days';
}

export default function DashboardHabitCard({ habit, todayEntry, weekDays }: DashboardHabitCardProps) {
  return (
    <article className="dashboard-habit-card">
      <div className="dashboard-habit-card__header">
        <div>
          <p className="dashboard-habit-card__eyebrow">{habit.habitType === 'BOOLEAN' ? 'Boolean' : 'Numeric'}</p>
          <h3 className="dashboard-habit-card__title">
            <Link className="dashboard-habit-card__title-link" to={`/habits/${habit.id}`}>
              {habit.title}
            </Link>
          </h3>
        </div>
        <span className="dashboard-pill dashboard-pill--soft">Streak {habit.currentStreak}</span>
      </div>

      <p className="dashboard-habit-card__description">
        {habit.description?.trim() ? habit.description : 'No description added'}
      </p>

      <div className="dashboard-habit-card__meta">
        <span>{formatFrequencyLabel(habit)}</span>
        <span>Today: {getTodayStatusLabel(todayEntry)}</span>
      </div>

      <div className="dashboard-habit-card__footer">
        <DashboardWeekStrip days={weekDays} />
      </div>
    </article>
  );
}