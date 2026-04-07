import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

export default function NotFoundPage() {
  return (
    <section>
      <h1>Page not found</h1>
      <p>The page you requested does not exist.</p>
      <p>
        <Link to={ROUTES.APP_HOME}>Go to dashboard</Link>
      </p>
    </section>
  );
}
