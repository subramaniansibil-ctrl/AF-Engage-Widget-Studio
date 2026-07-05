import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-mist px-6 text-center text-ink">
      <section>
        <p className="text-sm font-semibold text-sage">404</p>
        <h1 className="mt-2 text-4xl font-bold">Page not found</h1>
        <p className="mt-3 text-sm text-ink/65">The route you requested does not exist.</p>
        <Link
          to="/advisor/analytics"
          className="mt-6 inline-flex rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white"
        >
          Back to analytics
        </Link>
      </section>
    </main>
  );
}
