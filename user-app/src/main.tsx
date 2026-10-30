import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { AppStateProvider } from './flow/AppState';
import './styles/global.css';

// 読み上げの声と 日本語の改行のために 言語を日本語にする（デモURLの外枠には lang がつかないため）
document.documentElement.lang = 'ja';

// iPhone の Safari は、タッチの受け手がないと :active（押したとき沈む表示・N-07）を出さない
document.addEventListener('touchstart', () => {}, { passive: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppStateProvider>
      <App />
    </AppStateProvider>
  </StrictMode>,
);
