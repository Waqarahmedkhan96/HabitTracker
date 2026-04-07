import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type {
  CategoryResponse,
  FrequencyType,
  HabitRequest,
  HabitResponse,
  HabitType,
} from '../../types';
import './habits-ui.css';

const habitTypes: HabitType[] = ['BOOLEAN', 'NUMERIC'];
const frequencyTypes: FrequencyType[] = ['DAILY', 'SELECTED_DAYS'];
const weekdayOptions = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;

type Weekday = (typeof weekdayOptions)[number];

export interface HabitFormInitialValues {
  title?: string;
  description?: string;
  habitType?: HabitType;
  frequencyType?: FrequencyType;
  categoryId?: string;
  targetValue?: string;
  unit?: string;
  selectedDays?: Weekday[];
  active?: boolean;
}

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

function parseSelectedDaysCsv(selectedDaysCsv: HabitResponse['selectedDaysCsv']): Weekday[] {
  if (!selectedDaysCsv) {
    return [];
  }

  return selectedDaysCsv
    .split(',')
    .map((part) => part.trim().toUpperCase())
    .filter((value): value is Weekday => weekdayOptions.includes(value as Weekday));
}

export function mapHabitResponseToHabitFormInitialValues(habit: HabitResponse): HabitFormInitialValues {
  return {
    title: habit.title,
    description: habit.description ?? '',
    habitType: habit.habitType,
    frequencyType: habit.frequencyType,
    categoryId: habit.categoryId ?? '',
    targetValue: habit.targetValue != null ? String(habit.targetValue) : '',
    unit: habit.unit ?? '',
    selectedDays: parseSelectedDaysCsv(habit.selectedDaysCsv),
    active: habit.active,
  };
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

  const sortedSelectedDays = useMemo(
    () => weekdayOptions.filter((day) => selectedDays.includes(day)),
    [selectedDays],
  );

  const toggleSelectedDay = (day: Weekday) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((value) => value !== day) : [...prev, day]));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      setValidationError('Title is required');
      return;
    }

    if (!habitType) {
      setValidationError('Habit type is required');
      return;
    }

    if (!frequencyType) {
      setValidationError('Frequency type is required');
      return;
    }

    if (habitType === 'NUMERIC') {
      const numericTarget = Number(targetValue);
      if (!targetValue.trim() || Number.isNaN(numericTarget) || numericTarget <= 0) {
        setValidationError('Target value is required and must be greater than 0 for numeric habits');
        return;
      }
    }

    if (frequencyType === 'SELECTED_DAYS' && sortedSelectedDays.length === 0) {
      setValidationError('Select at least one day for selected-days frequency');
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
      selectedDaysCsv:
        frequencyType === 'SELECTED_DAYS' && sortedSelectedDays.length > 0
          ? sortedSelectedDays.join(',')
          : undefined,
      active,
    });
  };

  return (
    <div className="habit-form-shell">
      <form onSubmit={handleSubmit} className="habit-form-card">
        <section className="habit-form-section">
          <div className="habit-form-section__header">
            <h2 className="habit-form-section__title">Basic info</h2>
            <p className="habit-form-section__subtitle">Define what you want to build as a habit.</p>
          </div>

          <div className="habit-form-grid">
            <label className="habit-form-field habit-form-field--full">
              <span className="habit-form-label">Title</span>
              <input
                className="habit-form-input"
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Example: Morning walk"
              />
            </label>

            <label className="habit-form-field habit-form-field--full">
              <span className="habit-form-label">Description</span>
              <textarea
                className="habit-form-input habit-form-textarea"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Optional context about this habit"
              />
            </label>
          </div>
        </section>

        <section className="habit-form-section">
          <div className="habit-form-section__header">
            <h2 className="habit-form-section__title">Tracking setup</h2>
            <p className="habit-form-section__subtitle">Choose how and when this habit should be tracked.</p>
          </div>

          <div className="habit-form-grid">
            <label className="habit-form-field">
              <span className="habit-form-label">Habit type</span>
              <select
                className="habit-form-input"
                value={habitType}
                onChange={(event) => setHabitType(event.target.value as HabitType)}
              >
                {habitTypes.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="habit-form-field">
              <span className="habit-form-label">Frequency type</span>
              <select
                className="habit-form-input"
                value={frequencyType}
                onChange={(event) => setFrequencyType(event.target.value as FrequencyType)}
              >
                {frequencyTypes.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="habit-form-field habit-form-field--full">
              <span className="habit-form-label">Category</span>
              <select className="habit-form-input" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                <option value="">None</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {frequencyType === 'SELECTED_DAYS' && (
            <fieldset className="habit-form-days">
              <legend className="habit-form-days__legend">Selected days</legend>
              <div className="habit-form-days__grid">
                {weekdayOptions.map((day) => (
                  <label key={day} className="habit-form-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedDays.includes(day)}
                      onChange={() => toggleSelectedDay(day)}
                    />
                    <span>{day}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </section>

        {habitType === 'NUMERIC' && (
          <section className="habit-form-section">
            <div className="habit-form-section__header">
              <h2 className="habit-form-section__title">Numeric target</h2>
              <p className="habit-form-section__subtitle">Define a target and optional unit for value-based tracking.</p>
            </div>

            <div className="habit-form-grid">
              <label className="habit-form-field">
                <span className="habit-form-label">Target value</span>
                <input
                  className="habit-form-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={targetValue}
                  onChange={(event) => setTargetValue(event.target.value)}
                />
              </label>

              <label className="habit-form-field">
                <span className="habit-form-label">Unit</span>
                <input className="habit-form-input" value={unit} onChange={(event) => setUnit(event.target.value)} />
              </label>
            </div>
          </section>
        )}

        <section className="habit-form-section">
          <div className="habit-form-section__header">
            <h2 className="habit-form-section__title">Status and actions</h2>
            <p className="habit-form-section__subtitle">Choose if this habit is active and save your changes.</p>
          </div>

          <label className="habit-form-toggle">
            <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
            <span>Active habit</span>
          </label>

          {(validationError || error) && <p className="habit-form-error">{validationError ?? error}</p>}

          <div className="habit-form-actions">
            <button className="habits-button habits-button--primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? submittingLabel : submitLabel}
            </button>
            <button className="habits-button habits-button--ghost" type="button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}