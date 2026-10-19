import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { CategoryResponse, FrequencyType, HabitRequest, HabitType } from '../../types';
import { ROUTES } from '../../constants/routes';
import Icon, { type IconName } from '../ui/Icon';
import Spinner from '../ui/Spinner';
import { weekdayOptions, type HabitFormInitialValues, type Weekday } from './habitFormUtils';
import './habits-ui.css';

const habitTypeOptions: Array<{ value: HabitType; title: string; description: string; icon: IconName }> = [
  { value: 'BOOLEAN', title: 'Yes or no', description: 'Did you do it today? One tap to check it off.', icon: 'check-circle' },
  { value: 'NUMERIC', title: 'Measurable', description: 'Track an amount such as pages, glasses or minutes.', icon: 'target' },
];

const frequencyOptions: Array<{ value: FrequencyType; label: string }> = [
  { value: 'DAILY', label: 'Every day' },
  { value: 'SELECTED_DAYS', label: 'Specific days' },
];

const dayPresets: Array<{ label: string; days: Weekday[] }> = [
  { label: 'Weekdays', days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] },
  { label: 'Weekends', days: ['SATURDAY', 'SUNDAY'] },
  { label: 'Mon · Wed · Fri', days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'] },
];

const TITLE_MAX = 100;

interface HabitFormProps {
  categories: CategoryResponse[];
  initialValues?: HabitFormInitialValues;
  isSubmitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (payload: HabitRequest) => Promise<void>;
  onCancel: () => void;
  error?: string | null;
}

export default function HabitForm({
  categories,
  initialValues,
  isSubmitting,
  submitLabel,
  submittingLabel,
  onSubmit,
  onCancel,
  error,
}: HabitFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [habitType, setHabitType] = useState<HabitType>(initialValues?.habitType ?? 'BOOLEAN');
  const [frequencyType, setFrequencyType] = useState<FrequencyType>(initialValues?.frequencyType ?? 'DAILY');
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? '');
  const [targetValue, setTargetValue] = useState(initialValues?.targetValue ?? '');
  const [unit, setUnit] = useState(initialValues?.unit ?? '');
  const [selectedDays, setSelectedDays] = useState<Weekday[]>(initialValues?.selectedDays ?? []);
  const [active, setActive] = useState(initialValues?.active ?? true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const sortedSelectedDays = useMemo(() => weekdayOptions.filter((day) => selectedDays.includes(day)), [selectedDays]);

  const toggleSelectedDay = (day: Weekday) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((value) => value !== day) : [...prev, day]));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      setValidationError('Give your habit a name.');
      return;
    }

    if (habitType === 'NUMERIC') {
      const numericTarget = Number(targetValue);
      if (!targetValue.trim() || Number.isNaN(numericTarget) || numericTarget <= 0) {
        setValidationError('Set a daily target greater than 0 for measurable habits.');
        return;
      }
    }

    if (frequencyType === 'SELECTED_DAYS' && sortedSelectedDays.length === 0) {
      setValidationError('Pick at least one day of the week.');
      return;
    }

    setValidationError(null);

    await onSubmit({
      title: normalizedTitle,
      description: description.trim() ? description.trim() : undefined,
      habitType,
      frequencyType,
      categoryId: categoryId || undefined,
      targetValue: habitType === 'NUMERIC' ? Number(targetValue) : undefined,
      unit: habitType === 'NUMERIC' && unit.trim() ? unit.trim() : undefined,
      selectedDaysCsv: frequencyType === 'SELECTED_DAYS' ? sortedSelectedDays.join(',') : undefined,
      active,
    });
  };

  const message = validationError ?? error;

  return (
    <form onSubmit={handleSubmit} className="habit-form" noValidate>
      <section className="card habit-form__section" style={{ ['--i' as string]: 0 }}>
        <header className="habit-form__section-head">
          <span className="habit-form__step">1</span>
          <div>
            <h2 className="card__title">The basics</h2>
            <p className="card__subtitle">Name it something you will recognise at a glance.</p>
          </div>
        </header>

        <label className="field">
          <span className="field__label">Name</span>
          <input
            className="input input--lg"
            required
            autoFocus
            maxLength={TITLE_MAX}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Morning walk"
          />
          <span className="field__hint habit-form__counter tabular">
            {title.length}/{TITLE_MAX}
          </span>
        </label>

        <label className="field">
          <span className="field__label">
            Description <span className="text-muted">(optional)</span>
          </span>
          <textarea
            className="input"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Why does this habit matter to you?"
            rows={3}
          />
        </label>

        <label className="field">
          <span className="field__label">Category</span>
          <select className="input" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <span className="field__hint">
            Need a new one?{' '}
            <Link to={ROUTES.CATEGORIES} className="habit-form__link">
              Manage categories
            </Link>
          </span>
        </label>
      </section>

      <section className="card habit-form__section" style={{ ['--i' as string]: 1 }}>
        <header className="habit-form__section-head">
          <span className="habit-form__step">2</span>
          <div>
            <h2 className="card__title">How you track it</h2>
            <p className="card__subtitle">Choose a simple check-off or a measurable goal.</p>
          </div>
        </header>

        <div className="choice-grid" role="radiogroup" aria-label="Habit type">
          {habitTypeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={habitType === option.value}
              className="choice-card"
              onClick={() => setHabitType(option.value)}
            >
              <span className="choice-card__icon">
                <Icon name={option.icon} size={20} />
              </span>
              <span className="choice-card__title">{option.title}</span>
              <span className="choice-card__description">{option.description}</span>
              <span className="choice-card__radio" aria-hidden="true" />
            </button>
          ))}
        </div>

        {habitType === 'NUMERIC' ? (
          <div className="habit-form__grid habit-form__reveal">
            <label className="field">
              <span className="field__label">Daily target</span>
              <input
                className="input"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={targetValue}
                onChange={(event) => setTargetValue(event.target.value)}
                placeholder="8"
              />
            </label>
            <label className="field">
              <span className="field__label">Unit</span>
              <input className="input" value={unit} maxLength={30} onChange={(event) => setUnit(event.target.value)} placeholder="glasses" />
            </label>
          </div>
        ) : null}
      </section>

      <section className="card habit-form__section" style={{ ['--i' as string]: 2 }}>
        <header className="habit-form__section-head">
          <span className="habit-form__step">3</span>
          <div>
            <h2 className="card__title">Schedule</h2>
            <p className="card__subtitle">Only scheduled days count towards your streak.</p>
          </div>
        </header>

        <div className="segmented habit-form__frequency" role="radiogroup" aria-label="Frequency">
          {frequencyOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={frequencyType === option.value}
              className="segmented__option"
              onClick={() => setFrequencyType(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {frequencyType === 'SELECTED_DAYS' ? (
          <div className="habit-form__days habit-form__reveal">
            <div className="day-picker" role="group" aria-label="Days of the week">
              {weekdayOptions.map((day) => (
                <button
                  key={day}
                  type="button"
                  className="day-picker__day"
                  aria-pressed={selectedDays.includes(day)}
                  onClick={() => toggleSelectedDay(day)}
                  title={day.charAt(0) + day.slice(1).toLowerCase()}
                >
                  {day.slice(0, 3).charAt(0) + day.slice(1, 3).toLowerCase()}
                </button>
              ))}
            </div>
            <div className="habit-form__presets">
              {dayPresets.map((preset) => (
                <button key={preset.label} type="button" className="chip" onClick={() => setSelectedDays(preset.days)}>
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <label className="switch habit-form__switch">
          <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
          <span className="switch__track" aria-hidden="true" />
          <span className="switch__text">
            <span className="switch__label">Active</span>
            <span className="switch__description">Inactive habits are archived and hidden from your dashboard.</span>
          </span>
        </label>
      </section>

      {message ? (
        <p className="alert alert--error" role="alert">
          <Icon name="alert" size={17} />
          {message}
        </p>
      ) : null}

      <div className="habit-form__actions">
        <button className="btn btn--ghost" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn--primary btn--lg" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner /> {submittingLabel}
            </>
          ) : (
            <>
              <Icon name="check" size={17} strokeWidth={2.4} /> {submitLabel}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
