import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { AppStateProvider } from './flow/AppState';
import { ensureSampleData } from './lib/store';
import './styles/global.css';

// サンプルの利用者（管理者画面の12人）を 今日の日付で用意する
ensureSampleData(new Date());

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
