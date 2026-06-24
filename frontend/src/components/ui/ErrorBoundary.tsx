import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './Button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('AF Engage render error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center bg-mist px-6 text-ink dark:bg-ink dark:text-white">
          <div className="max-w-md rounded-lg border border-ink/10 bg-white p-6 text-center shadow-panel dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-semibold text-coral">Something went wrong</p>
            <h1 className="mt-2 text-2xl font-bold">Workspace needs a refresh</h1>
            <p className="mt-3 text-sm leading-6 text-ink/65 dark:text-white/65">
              The app caught an unexpected rendering error before it could affect your data.
            </p>
            <Button className="mt-5" onClick={() => window.location.reload()}>
              Reload application
            </Button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
