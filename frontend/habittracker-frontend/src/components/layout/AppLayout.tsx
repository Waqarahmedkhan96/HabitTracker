import { NavLink, Outlet } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard' },
  { to: ROUTES.HABITS, label: 'Habits' },
  { to: ROUTES.CATEGORIES, label: 'Categories' },
  { to: ROUTES.STATS, label: 'Stats' },
  { to: ROUTES.PROFILE, label: 'Profile' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div style={{ display: 'grid', minHeight: '100vh', gridTemplateColumns: '220px 1fr' }}>
      <aside
        style={{
          borderRight: '1px solid #e5e7eb',
          padding: '1rem',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Habit Tracker</h2>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
            {user?.username}
          </p>
        </div>

        <nav style={{ display: 'grid', gap: '0.4rem' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                padding: '0.5rem 0.75rem',
                borderRadius: 8,
                textDecoration: 'none',
                background: isActive ? '#e5edff' : 'transparent',
                color: isActive ? '#1d4ed8' : '#111827',
                fontWeight: 500,
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={logout}
          style={{
            marginTop: 'auto',
            padding: '0.55rem 0.75rem',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            background: '#fff',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          Logout
        </button>
      </aside>

      <main style={{ padding: '1.25rem' }}>
        <Outlet />
      </main>
    </div>
  );
}
