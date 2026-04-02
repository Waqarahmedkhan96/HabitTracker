import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';

interface PublicOnlyRouteProps {
  children: ReactNode;
}

export default function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={ROUTES.APP_HOME} replace />;
  }

  return <>{children}</>;
}
