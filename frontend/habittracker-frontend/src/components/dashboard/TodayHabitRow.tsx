import { Link } from 'react-router-dom';
import type { HabitEntryResponse, HabitResponse } from '../../types';
import { formatFrequency } from '../../utils/dates';
import Icon from '../ui/Icon';
import ProgressRing from '../ui/ProgressRing';
import Spinner from '../ui/Spinner';
import DashboardWeekStrip, { type DashboardWeekDay } from './DashboardWeekStrip';

interface TodayHabitRowProps {
  habit: HabitResponse;
  todayEntry?: HabitEntryResponse;
  weekDays: DashboardWeekDay[];
  numericValue: string;
  isSaving: boolean;
  index: number;
  onNumericChange: (value: string) => void;
  onComplete: () => void;
  onMissed: () => void;
  onSaveNumeric: () => void;
}

const statusText = {
  COMPLETED: 'Done',
  PARTIAL: 'Partial',
  MISSED: 'Missed',
} as const;

export default function TodayHabitRow({
  habit,
  todayEntry,
  weekDays,
  numericValue,
  isSaving,
  index,
  onNumericChange,
  onComplete,
  onMissed,
  onSaveNumeric,
}: TodayHabitRowProps) {
  const status = todayEntry?.status;
  const isNumeric = habit.habitType === 'NUMERIC';
  const target = habit.targetValue ?? 0;
  const numericNumber = Number(numericValue);
  const numericProgress = target > 0 && numericValue.trim() !== '' && Number.isFinite(numericNumber) ? (numericNumber / target) * 100 : 0;
  const savedValue = todayEntry?.valueAchieved != null ? String(todayEntry.valueAchieved) : '';
  const isNumericDirty = isNumeric && numericValue.trim() !== savedValue;

  const step = (delta: number) => {
    const current = Number.isFinite(numericNumber) && numericValue.trim() !== '' ? numericNumber : 0;
    onNumericChange(String(Math.max(0, Math.round((current + delta) * 100) / 100)));
  };

  return (
    <article
      className={`today-row${status ? ` today-row--${status.toLowerCase()}` : ''}${isSaving ? ' today-row--saving' : ''}`}
      style={{ ['--i' as string]: index }}
    >
      <div className="today-row__check-wrap">
        {isNumeric ? (
          <ProgressRing
            value={status === 'COMPLETED' ? 100 : numericProgress}
            size={44}
            strokeWidth={4}
            tone={status === 'COMPLETED' ? 'success' : status === 'MISSED' ? 'danger' : 'warning'}
            label={`${numericValue || 0} of ${target} ${habit.unit ?? ''}`}
          >
            {status === 'COMPLETED' ? (
              <Icon name="check" size={18} strokeWidth={2.6} className="today-row__ring-icon today-row__ring-icon--done" />
            ) : (
              <span className="today-row__ring-text tabular">{Math.min(999, Math.round(numericProgress))}%</span>
            )}
          </ProgressRing>
        ) : (
          <button
            type="button"
            className="today-check"
            aria-pressed={status === 'COMPLETED'}
            aria-label={status === 'COMPLETED' ? `${habit.title} completed` : `Mark ${habit.title} as completed`}
            onClick={onComplete}
            disabled={isSaving}
          >
            {isSaving ? (
              <Spinner size={18} />
            ) : status === 'MISSED' ? (
              <Icon name="x" size={20} strokeWidth={2.4} />
            ) : (
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" className="today-check__svg">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            )}
          </button>
        )}
      </div>

      <div className="today-row__main">
        <div className="today-row__title-line">
          <Link to={`/habits/${habit.id}`} className="today-row__title">
            {habit.title}
          </Link>
          {status ? (
            <span
              className={`badge badge--${status === 'COMPLETED' ? 'success' : status === 'PARTIAL' ? 'warning' : 'danger'} today-row__status`}
            >
              {statusText[status]}
            </span>
          ) : null}
        </div>
        <div className="today-row__meta">
          {habit.categoryName ? <span className="today-row__category">{habit.categoryName}</span> : null}
          <span>{formatFrequency(habit)}</span>
          {isNumeric ? (
            <span>
              Goal {habit.targetValue ?? '—'} {habit.unit ?? ''}
            </span>
          ) : null}
        </div>
      </div>

      <div className="today-row__week">
        <DashboardWeekStrip days={weekDays} />
      </div>

      <div className="today-row__streak" title="Current streak">
        <Icon name="flame" size={16} />
        <span className="tabular">{habit.currentStreak}</span>
      </div>

      <div className="today-row__actions">
        {isNumeric ? (
          <form
            className="today-numeric"
            onSubmit={(event) => {
              event.preventDefault();
              onSaveNumeric();
            }}
          >
            <div className="stepper">
              <button type="button" className="stepper__btn" onClick={() => step(-1)} aria-label="Decrease" disabled={isSaving}>
                <Icon name="minus" size={14} strokeWidth={2.4} />
              </button>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                className="stepper__input tabular"
                value={numericValue}
                onChange={(event) => onNumericChange(event.target.value)}
                placeholder="–"
                aria-label={`${habit.title} value${habit.unit ? ` in ${habit.unit}` : ''}`}
                disabled={isSaving}
              />
              <button type="button" className="stepper__btn" onClick={() => step(1)} aria-label="Increase" disabled={isSaving}>
                <Icon name="plus" size={14} strokeWidth={2.4} />
              </button>
            </div>
            <button
              type="submit"
              className={`btn btn--sm ${isNumericDirty && numericValue.trim() !== '' ? 'btn--primary' : 'btn--secondary'}`}
              disabled={isSaving || (!isNumericDirty && Boolean(status))}
              title={numericValue.trim() === '' ? 'Leave empty to mark as missed' : undefined}
            >
              {isSaving ? <Spinner size={14} /> : numericValue.trim() === '' ? 'Missed' : 'Log'}
            </button>
          </form>
        ) : (
          <button
            type="button"
            className={`btn btn--sm btn--ghost today-row__miss${status === 'MISSED' ? ' is-active' : ''}`}
            onClick={onMissed}
            disabled={isSaving || status === 'MISSED'}
          >
            <Icon name="x" size={14} strokeWidth={2.2} />
            Missed
          </button>
        )}
      </div>
    </article>
  );
}
