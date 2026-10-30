// デモビルド専用：react-dom/client を CDN の ReactDOM（UMD）に差し替える
import * as ReactDOM from 'react-dom';

export const createRoot = (ReactDOM as unknown as typeof import('react-dom/client')).createRoot;
