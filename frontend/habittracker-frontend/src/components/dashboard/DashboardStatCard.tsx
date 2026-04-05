interface DashboardStatCardProps {
  label: string;
  value: string;
  detail?: string;
}

export default function DashboardStatCard({ label, value, detail }: DashboardStatCardProps) {
  return (
    <article className="dashboard-stat-card">
      <p className="dashboard-stat-card__label">{label}</p>
      <p className="dashboard-stat-card__value">{value}</p>
      {detail ? <p className="dashboard-stat-card__detail">{detail}</p> : null}
    </article>
  );
}