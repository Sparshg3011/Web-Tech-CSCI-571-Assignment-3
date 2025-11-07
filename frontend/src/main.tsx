import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import './index.css';
import App from './App.tsx';
import { FavoritesProvider } from './context/FavoritesContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FavoritesProvider>
      <Toaster position="top-right" richColors expand closeButton />
      <App />
    </FavoritesProvider>
  </StrictMode>,
);
