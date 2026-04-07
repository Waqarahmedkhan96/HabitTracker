import { Link } from 'react-router-dom';
import type { Dispatch, SetStateAction } from 'react';
import type { HabitEntryResponse, HabitResponse, UUID } from '../../types';
import DashboardWeekStrip, { type DashboardWeekDay } from './DashboardWeekStrip';

interface DueHabitRow {
  habit: HabitResponse;
  todayEntry?: HabitEntryResponse;
  weekDays: DashboardWeekDay[];
}

interface DashboardDueTodayTableProps {
  rows: DueHabitRow[];
  numericValues: Record<UUID, string>;
  setNumericValues: Dispatch<SetStateAction<Record<UUID, string>>>;
  savingHabitId: UUID | null;
  onComplete: (habitId: UUID) => void;
  onMissed: (habitId: UUID) => void;
  onSaveNumeric: (habit: HabitResponse) => void;
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

function getStatusClass(entry?: HabitEntryResponse) {
  if (!entry) {
    return 'dashboard-pill--muted';
  }

  if (entry.status === 'COMPLETED') {
    return 'dashboard-pill--success';
  }

  if (entry.status === 'PARTIAL') {
    return 'dashboard-pill--warning';
  }

  return 'dashboard-pill--danger';
}

function getBooleanActionPrimary(entry?: HabitEntryResponse) {
  if (entry?.status === 'MISSED') {
    return 'MISSED';
  }

  return 'COMPLETED';
}

export default function DashboardDueTodayTable({
  rows,
  numericValues,
  setNumericValues,
  savingHabitId,
  onComplete,
  onMissed,
  onSaveNumeric,
}: DashboardDueTodayTableProps) {
  return (
    <div className="dashboard-table-wrap">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th scope="col">Habit</th>
            <th scope="col">Description</th>
            <th scope="col">Today status</th>
            <th scope="col">Action</th>
            <th scope="col">Current week</th>
            <th scope="col">Streak</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ habit, todayEntry, weekDays }) => {
            const numericValue = numericValues[habit.id] ?? '';
            const isSaving = savingHabitId === habit.id;
            const booleanPrimaryAction = getBooleanActionPrimary(todayEntry);

            return (
              <tr key={habit.id}>
                <td>
                  <div className="dashboard-table__habit-cell">
                    <Link className="dashboard-table__habit-title-link" to={`/habits/${habit.id}`}>
                      <span className="dashboard-table__habit-title">{habit.title}</span>
                    </Link>
                    {habit.categoryName ? (
                      <span className="dashboard-table__habit-category">{habit.categoryName}</span>
                    ) : null}
                  </div>
                </td>
                <td>
                  <p className="dashboard-table__description">
                    {habit.description?.trim() ? habit.description : 'No description added'}
                  </p>
                </td>
                <td>
                  <span className={`dashboard-pill ${getStatusClass(todayEntry)}`}>
                    {getTodayStatusLabel(todayEntry)}
                  </span>
                </td>
                <td>
                  {habit.habitType === 'BOOLEAN' ? (
                    <div className="dashboard-action-group">
                      <button
                        type="button"
                        className={
                          booleanPrimaryAction === 'COMPLETED'
                            ? 'dashboard-button dashboard-button--primary'
                            : 'dashboard-button dashboard-button--secondary'
                        }
                        disabled={isSaving}
                        onClick={() => onComplete(habit.id)}
                      >
                        Complete
                      </button>
                      <button
                        type="button"
                        className={
                          booleanPrimaryAction === 'MISSED'
                            ? 'dashboard-button dashboard-button--primary'
                            : 'dashboard-button dashboard-button--secondary'
                        }
                        disabled={isSaving}
                        onClick={() => onMissed(habit.id)}
                      >
                        Missed
                      </button>
                    </div>
                  ) : (
                    <div className="dashboard-action-group dashboard-action-group--numeric">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="dashboard-numeric-input"
                        value={numericValue}
                        onChange={(event) =>
                          setNumericValues((prev) => ({
                            ...prev,
                            [habit.id]: event.target.value,
                          }))
                        }
                        placeholder={habit.unit ?? 'value'}
                      />
                      <button
                        type="button"
                        className="dashboard-button dashboard-button--primary"
                        disabled={isSaving}
                        onClick={() => onSaveNumeric(habit)}
                      >
                        {numericValue.trim() === '' ? 'Mark missed' : 'Save'}
                      </button>
                    </div>
                  )}
                  {habit.habitType === 'NUMERIC' ? (
                    <p className="dashboard-table__helper">Leave empty to mark as missed</p>
                  ) : null}
                </td>
                <td>
                  <DashboardWeekStrip days={weekDays} />
                </td>
                <td>
                  <span className="dashboard-table__streak">{habit.currentStreak}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}