import { useEffect, useState } from 'react';
import { dashboardApi } from '../api/dashboardApi';
import { ApiClientError } from '../api/client';
import type { DashboardResponse } from '../types';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await dashboardApi.getDashboard();
        setData(response);
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, []);

  if (isLoading) {
    return <p>Loading dashboard...</p>;
  }

  if (error) {
    return <p style={{ color: '#b91c1c' }}>{error}</p>;
  }

  if (!data) {
    return <p>No dashboard data available.</p>;
  }

  return (
    <section>
      <h1>Dashboard</h1>
      <p>Active habits: {data.totalActiveHabits}</p>
      <p>Completed today: {data.completedToday}</p>
      <p>Missed today: {data.missedToday}</p>
      <p>Today completion: {data.todayCompletionPercentage}%</p>

      <h2>Due today</h2>
      {data.habitTitlesDueToday.length === 0 ? (
        <p>No habits due today.</p>
      ) : (
        <ul>
          {data.habitTitlesDueToday.map((title) => (
            <li key={title}>{title}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
