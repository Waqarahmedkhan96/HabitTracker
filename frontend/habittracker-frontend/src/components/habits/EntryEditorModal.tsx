import { useState } from 'react';
import type { FormEvent } from 'react';
import type { HabitEntryResponse, HabitEntryStatus, HabitResponse } from '../../types';
import { getNumericEntryStatus } from '../../utils/habitEntryStatus';
import { fromIsoDate } from '../../utils/dates';
import Icon from '../ui/Icon';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';

export interface EntryDraft {
  status: HabitEntryStatus;
  valueAchieved?: number;
  note?: string;
}

interface EntryEditorModalProps {
  habit: HabitResponse;
  open: boolean;
  date: string | null;
  entry?: HabitEntryResponse;
  isSaving: boolean;
  onClose: () => void;
  onSave: (date: string, draft: EntryDraft) => void;
}

const NOTE_MAX = 280;

function EntryEditorForm({
  habit,
  date,
  entry,
  isSaving,
  onClose,
  onSave,
}: Omit<EntryEditorModalProps, 'date' | 'open'> & { date: string }) {
  const isNumeric = habit.habitType === 'NUMERIC';
  const [status, setStatus] = useState<HabitEntryStatus>(entry?.status === 'MISSED' ? 'MISSED' : 'COMPLETED');
  const [value, setValue] = useState(entry?.valueAchieved != null ? String(entry.valueAchieved) : '');
  const [note, setNote] = useState(entry?.note ?? '');
  const [error, setError] = useState<string | null>(null);

  const numeric = Number(value);
  const derivedStatus: HabitEntryStatus | null = isNumeric
    ? value.trim() === ''
      ? 'MISSED'
      : Number.isFinite(numeric) && numeric >= 0
        ? getNumericEntryStatus(numeric, habit.targetValue)
        : null
    : status;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!derivedStatus) {
      setError('Enter a value of 0 or more.');
      return;
    }
    onSave(date, {
      status: derivedStatus,
      valueAchieved: isNumeric && value.trim() !== '' ? numeric : undefined,
      note: note.trim() ? note.trim() : undefined,
    });
  };

  return (
    <form className="entry-editor" onSubmit={submit}>
      {isNumeric ? (
        <label className="field">
          <span className="field__label">
            Amount{habit.unit ? ` (${habit.unit})` : ''} · goal {habit.targetValue ?? '—'}
          </span>
          <input
            className="input input--lg"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Leave empty to mark as missed"
            autoFocus
          />
          {derivedStatus ? (
            <span className={`badge badge--${derivedStatus === 'COMPLETED' ? 'success' : derivedStatus === 'PARTIAL' ? 'warning' : 'danger'} entry-editor__derived`}>
              Will be saved as {derivedStatus.toLowerCase()}
            </span>
          ) : null}
        </label>
      ) : (
        <div className="choice-grid entry-editor__choices" role="radiogroup" aria-label="Status">
          {(['COMPLETED', 'MISSED'] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={status === option}
              className={`choice-card entry-choice entry-choice--${option.toLowerCase()}`}
              onClick={() => setStatus(option)}
            >
              <span className="choice-card__icon">
                <Icon name={option === 'COMPLETED' ? 'check' : 'x'} size={18} strokeWidth={2.4} />
              </span>
              <span className="choice-card__title">{option === 'COMPLETED' ? 'Completed' : 'Missed'}</span>
              <span className="choice-card__radio" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}

      <label className="field">
        <span className="field__label">
          Note <span className="text-muted">(optional)</span>
        </span>
        <textarea
          className="input"
          rows={3}
          maxLength={NOTE_MAX}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="How did it go?"
        />
        <span className="field__hint habit-form__counter tabular">
          {note.length}/{NOTE_MAX}
        </span>
      </label>

      {error ? (
        <p className="alert alert--error" role="alert">
          <Icon name="alert" size={16} /> {error}
        </p>
      ) : null}

      <div className="modal__footer">
        <button type="button" className="btn btn--secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={isSaving}>
          {isSaving ? <Spinner /> : <Icon name="check" size={16} strokeWidth={2.4} />} Save entry
        </button>
      </div>
    </form>
  );
}

export default function EntryEditorModal({ habit, open, date, entry, isSaving, onClose, onSave }: EntryEditorModalProps) {
  const label = date
    ? fromIsoDate(date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <Modal
      open={open && date !== null}
      onClose={onClose}
      size="sm"
      labelledById="entry-editor-title"
      title={entry ? 'Edit entry' : 'Log entry'}
      description={label}
    >
      {date ? (
        <EntryEditorForm key={`${date}-${entry?.id ?? 'new'}`} habit={habit} date={date} entry={entry} isSaving={isSaving} onClose={onClose} onSave={onSave} />
      ) : null}
    </Modal>
  );
}
