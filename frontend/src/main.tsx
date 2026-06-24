import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from './app/store';
import { router } from './app/router';
import { AppRuntime } from './components/AppRuntime';
import { InjectedOverlayGuard } from './components/InjectedOverlayGuard';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <ErrorBoundary>
        <InjectedOverlayGuard />
        <AppRuntime />
        <RouterProvider router={router} />
      </ErrorBoundary>
    </Provider>
  </React.StrictMode>,
);
