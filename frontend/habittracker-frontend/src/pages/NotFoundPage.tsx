import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../hooks/useAuth';
import Icon from '../components/ui/Icon';
import Logo from '../components/ui/Logo';

export default function NotFoundPage() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="not-found">
      <div className="not-found__glow" aria-hidden="true" />
      <div className="not-found__card animate-scale-in">
        <Logo size={44} />
        <p className="not-found__code">404</p>
        <h1 className="not-found__title">This page took a day off</h1>
        <p className="not-found__message">The page you are looking for does not exist or has been moved.</p>
        <Link to={isAuthenticated ? ROUTES.APP_HOME : ROUTES.LOGIN} className="btn btn--primary btn--lg">
          <Icon name="arrow-left" size={17} />
          {isAuthenticated ? 'Back to dashboard' : 'Go to sign in'}
        </Link>
      </div>
    </section>
  );
}
