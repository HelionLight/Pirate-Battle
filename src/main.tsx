import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { App } from './app/App';
import { queryClient } from './app/queryClient';
import { MatchSyncBootstrap } from './sync/MatchSyncBootstrap';
import './styles/global.css';

async function enableMocking(): Promise<void> {
  if (import.meta.env.VITE_ENABLE_MSW === 'false') return;

  const { worker } = await import('./mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
}

void enableMocking().then(() => {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('The root element is missing.');

  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <MatchSyncBootstrap />
        <App />
      </QueryClientProvider>
    </StrictMode>,
  );
});
