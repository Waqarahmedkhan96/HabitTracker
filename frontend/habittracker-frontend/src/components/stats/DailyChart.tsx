import { useState } from 'react';
import type { DayStat } from '../../utils/statistics';

interface DailyChartProps {
  days: DayStat[];
}

const HEIGHT = 200;
const GRID = [0, 25, 50, 75, 100];

export default function DailyChart({ days }: DailyChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const gap = days.length > 45 ? 2 : days.length > 14 ? 4 : 10;
  const labelEvery = days.length > 45 ? 14 : days.length > 14 ? 5 : 1;
  const active = hovered !== null ? days[hovered] : null;

  return (
    <div className="daily-chart">
      <div className="daily-chart__axis" aria-hidden="true">
        {[...GRID].reverse().map((value) => (
          <span key={value}>{value}%</span>
        ))}
      </div>

      <div className="daily-chart__plot" onMouseLeave={() => setHovered(null)}>
        <div className="daily-chart__grid" aria-hidden="true">
          {GRID.map((value) => (
            <span key={value} style={{ bottom: `${value}%` }} />
          ))}
        </div>

        <div className="daily-chart__bars" style={{ gap, height: HEIGHT }} role="list" aria-label="Daily completion rate">
          {days.map((day, index) => {
            const value = day.rate ?? 0;
            const tone = day.rate === null ? 'none' : value >= 100 ? 'perfect' : value >= 50 ? 'good' : 'low';
            return (
              <div
                key={day.iso}
                role="listitem"
                className={`daily-chart__col${hovered === index ? ' is-hovered' : ''}`}
                onMouseEnter={() => setHovered(index)}
                onFocus={() => setHovered(index)}
                onBlur={() => setHovered(null)}
                tabIndex={0}
                aria-label={`${day.date.toLocaleDateString(undefined, { dateStyle: 'medium' })}: ${
                  day.rate === null ? 'nothing scheduled' : `${Math.round(value)}% (${day.completed} of ${day.scheduled})`
                }`}
              >
                <span
                  className={`daily-chart__bar daily-chart__bar--${tone}`}
                  style={{ height: `${Math.max(day.rate === null ? 0 : 3, value)}%`, animationDelay: `${index * (600 / days.length)}ms` }}
                />
              </div>
            );
          })}
        </div>

        <div className="daily-chart__labels" style={{ gap }} aria-hidden="true">
          {days.map((day, index) => (
            <span key={day.iso}>
              {index % labelEvery === 0 || index === days.length - 1
                ? days.length > 14
                  ? day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                  : day.date.toLocaleDateString(undefined, { weekday: 'short' })
                : ''}
            </span>
          ))}
        </div>

        {active && hovered !== null ? (
          <div
            className="daily-chart__tooltip"
            style={{ left: `${((hovered + 0.5) / days.length) * 100}%` }}
            role="status"
          >
            <strong>{active.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
            {active.rate === null ? (
              <span>Nothing scheduled</span>
            ) : (
              <>
                <span className="tabular">{Math.round(active.rate)}% complete</span>
                <span className="tabular">
                  {active.completed} done · {active.partial} partial · {active.missed} missed
                </span>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
