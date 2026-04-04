import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type {
  CategoryResponse,
  FrequencyType,
  HabitRequest,
  HabitResponse,
  HabitType,
} from '../../types';

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
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem', maxWidth: 520 }}>
      <label>
        Title
        <input required value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>

      <label>
        Description
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>

      <label>
        Habit type
        <select value={habitType} onChange={(event) => setHabitType(event.target.value as HabitType)}>
          {habitTypes.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label>
        Frequency type
        <select
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

      <label>
        Category
        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          <option value="">None</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      {habitType === 'NUMERIC' && (
        <>
          <label>
            Target value
            <input
              type="number"
              min="0"
              step="0.01"
              value={targetValue}
              onChange={(event) => setTargetValue(event.target.value)}
            />
          </label>

          <label>
            Unit
            <input value={unit} onChange={(event) => setUnit(event.target.value)} />
          </label>
        </>
      )}

      {frequencyType === 'SELECTED_DAYS' && (
        <fieldset style={{ border: '1px solid #d1d5db', padding: '0.75rem' }}>
          <legend>Selected days</legend>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.4rem' }}>
            {weekdayOptions.map((day) => (
              <label key={day} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectedDays.includes(day)}
                  onChange={() => toggleSelectedDay(day)}
                />
                {day}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <label>
        <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
        Active
      </label>

      {(validationError || error) && <p style={{ color: '#b91c1c' }}>{validationError ?? error}</p>}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? submittingLabel : submitLabel}
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}