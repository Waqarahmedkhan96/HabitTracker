import { useState } from 'react';
import { exportApi } from '../api/exportApi';
import { ApiClientError } from '../api/client';

const downloadText = (fileName: string, text: string) => {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export default function StatsPage() {
  const [error, setError] = useState<string | null>(null);

  const onExportHabits = async () => {
    setError(null);
    try {
      const csv = await exportApi.exportHabitsCsv();
      downloadText('habittracker-habits.csv', csv);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to export habits');
    }
  };

  const onExportEntries = async () => {
    setError(null);
    try {
      const csv = await exportApi.exportEntriesCsv();
      downloadText('habittracker-entries.csv', csv);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to export entries');
    }
  };

  return (
    <section>
      <h1>Stats</h1>
      <p>Phase 1 placeholder: use dashboard and habit metrics APIs for advanced statistics in later phases.</p>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button type="button" onClick={onExportHabits}>
          Export habits CSV
        </button>
        <button type="button" onClick={onExportEntries}>
          Export entries CSV
        </button>
      </div>

      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
    </section>
  );
}
