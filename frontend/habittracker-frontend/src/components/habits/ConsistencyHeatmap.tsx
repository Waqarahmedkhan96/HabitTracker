import { useMemo } from 'react';
import type { HabitEntryResponse, HabitResponse } from '../../types';
import { addDays, getWeekDates, isScheduledOn, toLocalIsoDate } from '../../utils/dates';

type CellStatus = 'completed' | 'partial' | 'missed' | 'no_entry' | 'unscheduled' | 'out';

interface ConsistencyHeatmapProps {
  habit: HabitResponse;
  entries: HabitEntryResponse[];
  weeks?: number;
  onSelectDay?: (isoDate: string) => void;
}

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', ''];

const statusLabel: Record<CellStatus, string> = {
  completed: 'Completed',
  partial: 'Partial',
  missed: 'Missed',
  no_entry: 'No entry',
  unscheduled: 'Not scheduled',
  out: '',
};

export default function ConsistencyHeatmap({ habit, entries, weeks = 26, onSelectDay }: ConsistencyHeatmapProps) {
  const columns = useMemo(() => {
    const today = new Date();
    const todayIso = toLocalIsoDate(today);
    const createdIso = habit.createdAt.slice(0, 10);
    const byDate = new Map(entries.map((entry) => [entry.entryDate, entry.status]));
    const firstMonday = addDays(getWeekDates(today)[0], -(weeks - 1) * 7);

    return Array.from({ length: weeks }, (_, weekIndex) => {
      const monday = addDays(firstMonday, weekIndex * 7);
      const days = Array.from({ length: 7 }, (_, dayIndex) => {
        const date = addDays(monday, dayIndex);
        const iso = toLocalIsoDate(date);
        const status = byDate.get(iso);
        let cell: CellStatus;
        if (iso > todayIso || (iso < createdIso && !status)) {
          cell = 'out';
        } else if (status) {
          cell = status.toLowerCase() as CellStatus;
        } else {
          cell = isScheduledOn(habit, date) ? 'no_entry' : 'unscheduled';
        }
        return { iso, date, cell, isToday: iso === todayIso };
      });
      const monthLabel =
        monday.getDate() <= 7 || weekIndex === 0 ? monday.toLocaleDateString(undefined, { month: 'short' }) : '';
      return { key: toLocalIsoDate(monday), days, monthLabel };
    });
  }, [habit, entries, weeks]);

  return (
    <div className="heatmap" role="group" aria-label={`Activity for the last ${weeks} weeks`}>
      <div className="heatmap__days" aria-hidden="true">
        <span />
        {DAY_LABELS.map((label, index) => (
          <span key={index}>{label}</span>
        ))}
      </div>
      <div className="heatmap__grid">
        {columns.map((column, columnIndex) => (
          <div key={column.key} className="heatmap__week" style={{ ['--i' as string]: columnIndex }}>
            <span className="heatmap__month" aria-hidden="true">
              {column.monthLabel}
            </span>
            {column.days.map((day) =>
              day.cell === 'out' ? (
                <span key={day.iso} className="heatmap__cell heatmap__cell--out" aria-hidden="true" />
              ) : (
                <button
                  key={day.iso}
                  type="button"
                  className={`heatmap__cell heatmap__cell--${day.cell}${day.isToday ? ' heatmap__cell--today' : ''}`}
                  title={`${day.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}: ${statusLabel[day.cell]}`}
                  aria-label={`${day.date.toLocaleDateString(undefined, { dateStyle: 'medium' })}, ${statusLabel[day.cell]}`}
                  onClick={onSelectDay ? () => onSelectDay(day.iso) : undefined}
                  disabled={!onSelectDay}
                />
              ),
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
